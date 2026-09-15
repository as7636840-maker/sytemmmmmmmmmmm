export function notFound(req, res) {
  res.status(404).json({ message: 'المسار غير موجود' })
}

export function errorHandler(err, req, res, next) {
  console.error(err)
  if (err.code === 11000) {
    return res.status(409).json({ message: 'القيمة دي مستخدمة قبل كده (تكرار)' })
  }
  if (err.name === 'ValidationError') {
    return res.status(400).json({ message: err.message })
  }
  res.status(err.status || 500).json({ message: err.message || 'حصل خطأ في السيرفر' })
}
