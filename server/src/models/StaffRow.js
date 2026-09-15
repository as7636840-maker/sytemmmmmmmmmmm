import mongoose from 'mongoose'

const staffRowSchema = new mongoose.Schema(
  {
    period: { type: mongoose.Schema.Types.ObjectId, ref: 'Period', required: true },
    employee: { type: mongoose.Schema.Types.ObjectId, ref: 'Employee', required: true },
    bonus: { type: Number, default: 0 },
    bonusReason: { type: String, default: '' },
    deduction: { type: Number, default: 0 },
    deductionReason: { type: String, default: '' },
  },
  { timestamps: true }
)

staffRowSchema.index({ period: 1, employee: 1 }, { unique: true })

export default mongoose.model('StaffRow', staffRowSchema)
