import taskRoutes from './routes/tasks.js'
import managementRoutes from './routes/management.js'
import attendanceRoutes from './routes/attendance.js'
import employeeAccountRoutes from './routes/employeeAccounts.js'
import Attendance from './models/Attendance.js'
import { requireAuth } from './middleware/auth.js'
import gameTrackerRoutes from './routes/gameTracker.js'
import './config/env.js'
import express from 'express'
import cors from 'cors'
import morgan from 'morgan'
import { connectDB, connectionDiagnostic } from './config/db.js'
import { notFound, errorHandler } from './middleware/errorHandler.js'

import authRoutes from './routes/auth.js'
import settingsRoutes from './routes/settings.js'
import periodsRoutes from './routes/periods.js'
import streamersRoutes from './routes/streamers.js'
import recruitersRoutes from './routes/recruiters.js'
import recruitingRecordsRoutes from './routes/recruitingRecords.js'
import employeesRoutes from './routes/employees.js'
import payrollRoutes from './routes/payroll.js'

import companyRoutes from './routes/companies.js'
import expenseRoutes from './routes/expenses.js'
import archiveRoutes from './routes/archive.js'

const app = express()

app.use(cors({ origin: process.env.CLIENT_ORIGIN || '*' }))
app.use('/api', (req,res,next) => {
  if (/^\/(auth|attendance|employee-accounts|health|tasks|management)(\/|$)/.test(req.path)) return next()
  requireAuth(req,res,()=>req.user.role==='employee'?res.status(403).json({message:'هذا الحساب للحضور والعمل فقط'}):next())
})
app.use('/api/game-tracker', gameTrackerRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/tasks', taskRoutes)
app.use(express.json({ limit: '3mb' }))
app.use('/api/companies', companyRoutes)
app.use(morgan('dev'))

app.get('/api/health', (req, res) => res.json({ ok: true }))

app.use('/api/auth', authRoutes)
app.use('/api/management', managementRoutes)
app.use('/api/attendance', attendanceRoutes)
app.use('/api/employee-accounts', employeeAccountRoutes)
app.use('/api/settings', settingsRoutes)
app.use('/api/periods', periodsRoutes)
app.use('/api/streamers', streamersRoutes)
app.use('/api/recruiters', recruitersRoutes)
app.use('/api/recruiting-records', recruitingRecordsRoutes)
app.use('/api/employees', employeesRoutes)
app.use('/api/payroll', payrollRoutes)
app.use('/api/archive', archiveRoutes)

app.use(notFound)
app.use(errorHandler)

const PORT = process.env.PORT || 5000

connectDB()
  .then(async () => {
    await Attendance.init()
    app.listen(PORT, () => console.log(`Golden Streamers API running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('Failed to connect to MongoDB:', connectionDiagnostic(err))
    process.exit(1)
  })
