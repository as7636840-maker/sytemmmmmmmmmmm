import mongoose from 'mongoose'
const schema = new mongoose.Schema({
  name: { type: String, required: true, trim: true, maxlength: 120 },
  nameKey: { type: String, required: true, unique: true },
}, { timestamps: true })
export default mongoose.model('Company', schema)
