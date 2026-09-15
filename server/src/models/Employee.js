import mongoose from 'mongoose'

// dept: 'management' | 'it'
const employeeSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true },
    dept: { type: String, enum: ['management', 'it'], required: true },
  },
  { timestamps: true }
)

export default mongoose.model('Employee', employeeSchema)
