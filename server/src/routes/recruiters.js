import { Router } from 'express'
import Recruiter from '../models/Recruiter.js'
import RecruitingRecord from '../models/RecruitingRecord.js'
import RecruiterAdjustment from '../models/RecruiterAdjustment.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { assertPeriodOpen } from './_guards.js'

const router = Router()

router.get('/', requireAuth, async (req, res, next) => {
  try {
    res.json(await Recruiter.find().sort({ name: 1 }))
  } catch (err) { next(err) }
})

router.post('/', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ message: 'اسم الريكروتر مطلوب' })
    res.status(201).json(await Recruiter.create({ name }))
  } catch (err) { next(err) }
})

router.delete('/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await Recruiter.findByIdAndDelete(req.params.id)
    await RecruitingRecord.deleteMany({ recruiter: req.params.id })
    await RecruiterAdjustment.deleteMany({ recruiter: req.params.id })
    res.status(204).end()
  } catch (err) { next(err) }
})

router.put('/adjustments/:periodId/:recruiterId', requireAuth, async (req, res, next) => {
  try {
    await assertPeriodOpen(req.params.periodId)
    const { bonus, bonusReason, deduction, deductionReason } = req.body
    const adj = await RecruiterAdjustment.findOneAndUpdate(
      { period: req.params.periodId, recruiter: req.params.recruiterId },
      { $set: { bonus, bonusReason, deduction, deductionReason } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    res.json(adj)
  } catch (err) { next(err) }
})

router.get('/adjustments/:periodId', requireAuth, async (req, res, next) => {
  try {
    res.json(await RecruiterAdjustment.find({ period: req.params.periodId }))
  } catch (err) { next(err) }
})

export default router
