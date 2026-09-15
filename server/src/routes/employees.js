import { Router } from 'express'
import Employee from '../models/Employee.js'
import StaffRow from '../models/StaffRow.js'
import { requireAuth, requireAdmin } from '../middleware/auth.js'
import { assertPeriodOpen } from './_guards.js'

const router = Router()

// dept param: 'management' | 'it'
router.get('/:dept', requireAuth, async (req, res, next) => {
  try {
    res.json(await Employee.find({ dept: req.params.dept }).sort({ name: 1 }))
  } catch (err) { next(err) }
})

router.post('/:dept', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    const { name } = req.body
    if (!name) return res.status(400).json({ message: 'اسم الموظف مطلوب' })
    res.status(201).json(await Employee.create({ name, dept: req.params.dept }))
  } catch (err) { next(err) }
})

router.delete('/:dept/:id', requireAuth, requireAdmin, async (req, res, next) => {
  try {
    await Employee.findByIdAndDelete(req.params.id)
    await StaffRow.deleteMany({ employee: req.params.id })
    res.status(204).end()
  } catch (err) { next(err) }
})

router.get('/:dept/rows/:periodId', requireAuth, async (req, res, next) => {
  try {
    const employees = await Employee.find({ dept: req.params.dept })
    const rows = await StaffRow.find({ period: req.params.periodId, employee: { $in: employees.map((e) => e._id) } })
    res.json(rows)
  } catch (err) { next(err) }
})

router.put('/:dept/rows/:periodId/:employeeId', requireAuth, async (req, res, next) => {
  try {
    await assertPeriodOpen(req.params.periodId)
    const { bonus, bonusReason, deduction, deductionReason } = req.body
    const update = {}
    if (bonus !== undefined) update.bonus = bonus
    if (bonusReason !== undefined) update.bonusReason = bonusReason
    if (deduction !== undefined) update.deduction = deduction
    if (deductionReason !== undefined) update.deductionReason = deductionReason

    const row = await StaffRow.findOneAndUpdate(
      { period: req.params.periodId, employee: req.params.employeeId },
      { $set: update },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    )
    res.json(row)
  } catch (err) { next(err) }
})

export default router
