import { Router, raw, json } from 'express'
import mongoose from 'mongoose'
import Settings from '../models/Settings.js'
import { previewWorkbook, validateNames } from '../lib/streamerImport.js'
import Streamer from '../models/Streamer.js'
import StreamerPerformance from '../models/StreamerPerformance.js'
import User from '../models/User.js'
import bcrypt from 'bcryptjs'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { assertPeriodOpen } from './_guards.js'

const router = Router()

router.post('/import/preview', requireAuth, requireAdmin, raw({ type: 'application/octet-stream', limit: '5mb' }), async (req, res, next) => {
  try { res.json(await previewWorkbook(req.body)) } catch (err) { next(err) }
})

router.post('/import', requireAuth, requireAdmin, json({ limit: '3mb' }), async (req, res, next) => {
  try {
    await assertPeriodOpen(req.body.periodId)
    const { names, duplicates } = validateNames(req.body.names)
    const settings = await Settings.findById('global')
    const rate = settings?.streamerRules?.defaultRate ?? 0.5
    // Upsert only inserts new names. Re-uploading never overwrites existing rates or payroll.
    const result = await Streamer.bulkWrite(names.map((name) => ({
      updateOne: { filter: { name }, update: { $setOnInsert: { name, rate, active: true } }, upsert: true },
    })))
    res.json({ added: result.upsertedCount, skipped: names.length - result.upsertedCount + duplicates, streamers: await Streamer.find().sort({ name: 1 }) })
  } catch (err) { next(err) }
})

// --- Master data: streamers ---
router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json(await Streamer.find().sort({ name: 1 }))
  } catch (err) { next(err) }
})

// --- Name & Rates is the source of truth for these linked streamer entries ---
router.post('/name-rates', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, rate, periodId, bonus = 0, bonusReason = '', deduction = 0, deductionReason = '' } = req.body
    if (!name?.trim()) return res.status(400).json({ message: 'Name is required' })
    if (!periodId) return res.status(400).json({ message: 'An open period is required' })
    await assertPeriodOpen(periodId)
    const settings = await Settings.findById('global')
    const streamer = await Streamer.create({
      name: name.trim(), rate: rate ?? settings?.streamerRules?.defaultRate ?? 0.5, source: 'name-rates',
    })
    await StreamerPerformance.findOneAndUpdate(
      { period: periodId, streamer: streamer._id },
      { $set: { bonus, bonusReason, deduction, deductionReason } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    res.status(201).json(streamer)
  } catch (err) { next(err) }
})

router.patch('/:id/name-rates', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const streamer = await Streamer.findOneAndUpdate(
      { _id: req.params.id, source: 'name-rates' },
      { $set: { rate: req.body.rate } }, { new: true }
    )
    if (!streamer) return res.status(404).json({ message: 'Synced streamer not found' })
    res.json(streamer)
  } catch (err) { next(err) }
})

router.put('/performance/name-rates/:periodId/:streamerId', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await assertPeriodOpen(req.params.periodId)
    const streamer = await Streamer.findOne({ _id: req.params.streamerId, source: 'name-rates' })
    if (!streamer) return res.status(404).json({ message: 'Synced streamer not found' })
    const { bonus, bonusReason, deduction, deductionReason } = req.body
    const perf = await StreamerPerformance.findOneAndUpdate(
      { period: req.params.periodId, streamer: streamer._id },
      { $set: { bonus, bonusReason, deduction, deductionReason } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    res.json(perf)
  } catch (err) { next(err) }
})

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name, rate, writeAccess, email, password } = req.body
    if (!name) return res.status(400).json({ message: 'اسم الستريمر مطلوب' })
    if (writeAccess && (!email || !password)) return res.status(400).json({ message: 'Email and password are required for write access' })
    if (writeAccess && await User.exists({ email: email.toLowerCase().trim() })) return res.status(409).json({ message: 'Email is already registered' })
    const settings = await Settings.findById('global')
    const streamer = await Streamer.create({ name, rate: rate ?? settings?.streamerRules?.defaultRate ?? 0.5 })
    if (writeAccess) {
      try {
        await User.create({ name, email: email.toLowerCase().trim(), passwordHash: await bcrypt.hash(password, 10), role: 'streamer', streamer: streamer._id })
      } catch (err) {
        await Streamer.findByIdAndDelete(streamer._id)
        throw err
      }
    }
    res.status(201).json({ ...streamer.toObject(), writeAccess: Boolean(writeAccess) })
  } catch (err) { next(err) }
})

router.patch('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const existing = await Streamer.findById(req.params.id)
    if (existing?.source === 'name-rates' && Object.prototype.hasOwnProperty.call(req.body, 'rate')) {
      return res.status(403).json({ message: 'Rate for synced streamers is managed in Name & Rates' })
    }
    const streamer = await Streamer.findByIdAndUpdate(req.params.id, req.body, { new: true })
    if (!streamer) return res.status(404).json({ message: 'الستريمر غير موجود' })
    res.json(streamer)
  } catch (err) { next(err) }
})

router.post('/bulk-delete', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { ids, periodId, confirmed } = req.body
    if (confirmed !== true || !Array.isArray(ids) || !ids.length || ids.length > 10000 ||
        ids.some(id => typeof id !== 'string' || !/^[a-f0-9]{24}$/i.test(id))) {
      return res.status(400).json({ message: 'حدد أسماء صحيحة وأكد الحذف (حتى 10000 اسم)' })
    }
    await assertPeriodOpen(periodId)
    const uniqueIds = [...new Set(ids)]
    let deletedCount = 0
    await mongoose.connection.transaction(async (session) => {
      const filter = { _id: { $in: uniqueIds } }
      await StreamerPerformance.deleteMany({ streamer: { $in: uniqueIds } }, { session })
      await User.deleteMany({ role: 'streamer', streamer: { $in: uniqueIds } }, { session })
      const result = await Streamer.deleteMany(filter, { session })
      deletedCount = result.deletedCount
    })
    res.json({ deletedCount, deletedIds: uniqueIds })
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await Streamer.findByIdAndDelete(req.params.id)
    await StreamerPerformance.deleteMany({ streamer: req.params.id })
    res.status(204).end()
  } catch (err) { next(err) }
})

// --- Monthly data: performance per period ---
router.get('/performance/:periodId', requireAuth, async (req, res, next) => {
  try {
    res.json(await StreamerPerformance.find({ period: req.params.periodId }))
  } catch (err) { next(err) }
})

router.put('/performance/:periodId/:streamerId', requireAuth, async (req, res, next) => {
  try {
    await assertPeriodOpen(req.params.periodId)
    if (req.user.role === 'streamer' && String(req.user.streamer) !== req.params.streamerId) {
      return res.status(403).json({ message: 'You can only edit your own record' })
    }
    if (req.user.role === 'streamer') {
      const allowed = ['score', 'days', 'hours', 'status']
      for (const key of Object.keys(req.body)) if (!allowed.includes(key)) delete req.body[key]
    }
    const streamer = await Streamer.findById(req.params.streamerId)
    const adjustmentFields = ['bonus', 'bonusReason', 'deduction', 'deductionReason']
    if (streamer?.source === 'name-rates' && adjustmentFields.some((key) => Object.prototype.hasOwnProperty.call(req.body, key))) {
      return res.status(403).json({ message: 'Bonus and deduction for synced streamers are managed in Name & Rates' })
    }
    const allowedFields = ['score', 'days', 'hours', 'status', 'bonus', 'bonusReason', 'deduction', 'deductionReason']
    const updates = Object.fromEntries(allowedFields
      .filter((key) => Object.prototype.hasOwnProperty.call(req.body, key))
      .map((key) => [key, req.body[key]]))
    const perf = await StreamerPerformance.findOneAndUpdate(
      { period: req.params.periodId, streamer: req.params.streamerId },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    res.json(perf)
  } catch (err) { next(err) }
})

export default router
