import { Router } from 'express'
import RecruitingRecord from '../models/RecruitingRecord.js'
import { requireAuth } from '../middleware/auth.js'
import { assertPeriodOpen } from './_guards.js'

const router = Router()

router.get('/:periodId', requireAuth, async (req, res, next) => {
  try {
    res.json(await RecruitingRecord.find({ period: req.params.periodId }).populate('recruiter', 'name'))
  } catch (err) { next(err) }
})

router.post('/:periodId', requireAuth, async (req, res, next) => {
  try {
    await assertPeriodOpen(req.params.periodId)
    const { recruiter, user, tier, score, days, hours } = req.body
    if (!recruiter || !user || !tier) {
      return res.status(400).json({ message: 'الريكروتر واسم المستخدم والـ Tier مطلوبين' })
    }
    const record = await RecruitingRecord.create({
      period: req.params.periodId, recruiter, user, tier, score, days, hours,
    })
    res.status(201).json(record)
  } catch (err) { next(err) }
})

router.delete('/:periodId/:recordId', requireAuth, async (req, res, next) => {
  try {
    await assertPeriodOpen(req.params.periodId)
    await RecruitingRecord.findByIdAndDelete(req.params.recordId)
    res.status(204).end()
  } catch (err) { next(err) }
})

export default router
