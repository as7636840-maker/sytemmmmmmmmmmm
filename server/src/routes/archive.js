import { Router } from 'express'
import Period from '../models/Period.js'
import StreamerPerformance from '../models/StreamerPerformance.js'
import RecruitingRecord from '../models/RecruitingRecord.js'
import RecruiterAdjustment from '../models/RecruiterAdjustment.js'
import StaffRow from '../models/StaffRow.js'
import Expense from '../models/Expense.js'
import Attendance from '../models/Attendance.js'
import GameTrackerRecord from '../models/GameTrackerRecord.js'
import Problem from '../models/Problem.js'
import { requireAuth } from '../middleware/auth.js'

const router = Router()
router.get('/periods', requireAuth, async (_req, res, next) => {
  try { res.json(await Period.find({ status: 'closed' }).sort({ closedAt: -1, createdAt: -1 })) } catch (err) { next(err) }
})
router.get('/:periodId', requireAuth, async (req, res, next) => {
  try {
    const period = await Period.findOne({ _id: req.params.periodId, status: 'closed' })
    if (!period) return res.status(404).json({ message: 'Closed period not found' })
    const [streamers, recruitingRecords, recruiterAdjustments, staffRows, expenses, attendance, gameTracker, problems] = await Promise.all([
      StreamerPerformance.find({ period: period._id }).populate('streamer', 'name').sort({ createdAt: 1 }),
      RecruitingRecord.find({ period: period._id }).populate('recruiter', 'name'),
      RecruiterAdjustment.find({ period: period._id }).populate('recruiter', 'name'),
      StaffRow.find({ period: period._id }).populate('employee', 'name dept'),
      Expense.find({ period: period._id }).populate('company', 'name').sort({ date: -1 }),
      Attendance.find({ periodId: period._id }).populate('userId', 'name fullName').sort({ workDate: 1 }),
      GameTrackerRecord.find({ periodId: period._id }).sort({ date: -1, _id: -1 }),
      Problem.find({ periodId: period._id }).populate('userId', 'name fullName').sort({ createdAt: -1 }),
    ])
    res.json({ period, streamers, recruitingRecords, recruiterAdjustments, staffRows, expenses, attendance, gameTracker, problems })
  } catch (err) { next(err) }
})
export default router
