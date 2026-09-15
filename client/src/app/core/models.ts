export interface Settings {
  egpConversionRate: number
  managementItBaseSalary: number
  tierAmounts: { [key: number]: number; 1: number; 2: number; 3: number; 4: number; 5: number }
  streamerRules: {
    defaultRate: number
    standard: { score: number; days: number; hours: number; pct: number }
    extra: { score: number; days: number; hours: number; pct: number }
  }
}

export interface Period {
  id: string
  label: string
  status: 'open' | 'closed'
}

export interface Streamer {
  id: string
  name: string
  rate: number
  source?: 'name-rates' | 'streamers'
  writeAccess?: boolean
}

export interface StreamerPerformance {
  periodId: string
  streamerId: string
  score: number
  days: number
  hours: number
  status: 'active' | 'inactive' | 'suspended'
  bonus: number
  bonusReason?: string
  deduction: number
  deductionReason?: string
}

export interface Recruiter { id: string; name: string }

export interface RecruitingRecord {
  id: string
  periodId: string
  recruiterId: string
  user: string
  tier: number
  score: number
  days: number
  hours: number
}

export interface RecruiterAdjustment {
  periodId: string
  recruiterId: string
  bonus: number
  bonusReason?: string
  deduction: number
  deductionReason?: string
}

export interface Employee { id: string; name: string; dept: 'management' | 'it' }

export interface StaffRow {
  periodId: string
  employeeId: string
  bonus: number
  bonusReason?: string
  deduction: number
  deductionReason?: string
}

export interface User {
  game_tracker_access?: boolean
  game_tracker_create?: boolean
  id: string
  name: string
  email: string
  fullName?: string
  status?: 'ACTIVE' | 'INACTIVE'
  role: 'admin' | 'staff' | 'streamer' | 'employee' | 'management'
  streamer?: string | null
}
