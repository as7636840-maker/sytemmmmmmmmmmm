import mongoose from 'mongoose'

const periodSchema = new mongoose.Schema(
  {
    label: { type: String, required: true },
    status: { type: String, enum: ['open', 'closed'], default: 'open' },
    closedAt: Date,
  },
  { timestamps: true }
)

export default mongoose.model('Period', periodSchema)
