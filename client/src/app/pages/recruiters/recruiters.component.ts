import { Component, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { RouterLink } from '@angular/router'
import { PayrollService } from '../../core/payroll.service'
import { AuthService } from '../../core/auth.service'
import { calcRecruiter, formatEGP } from '../../core/calc'
@Component({ selector: 'app-recruiters', standalone: true, imports: [CommonModule, FormsModule, RouterLink], templateUrl: './recruiters.component.html' })
export class RecruitersComponent {
  formatEGP = formatEGP
  newName = ''
  constructor(public payroll: PayrollService, public auth: AuthService) {}
  rows = computed(() => {
    const settings = this.payroll.settings()
    const periodId = this.payroll.currentPeriodId()
    return this.payroll.recruiters().map((rc) => {
      const records = this.payroll.recruitingRecords().filter((r) => r.periodId === periodId && r.recruiterId === rc.id)
      const adj = this.payroll.recruiterAdjustments().find((a) => a.periodId === periodId && a.recruiterId === rc.id) || { bonus: 0, deduction: 0, bonusReason: '', deductionReason: '' }
      return { recruiter: rc, adj, result: calcRecruiter(records, settings.tierAmounts, adj) }
    })
  })
  totals = computed(() => this.rows().reduce((sum, r) => ({amount: sum.amount + r.result.amount, bonus: sum.bonus + r.result.bonus, deduction: sum.deduction + r.result.deduction, total: sum.total + r.result.total}), {amount: 0, bonus: 0, deduction: 0, total: 0}))
  async addRecruiter() {
    if (this.newName.trim()) { if (await this.payroll.performAction(() => this.payroll.addRecruiter(this.newName.trim()))) this.newName = '' }
  }
  onBonusBlur(id: string, value: string) { this.payroll.upsertRecruiterAdjustment(this.payroll.currentPeriodId()!, id, { bonus: Number(value) }) }
  onDeductionBlur(id: string, value: string) { this.payroll.upsertRecruiterAdjustment(this.payroll.currentPeriodId()!, id, { deduction: Number(value) }) }
  onReasonBlur(id: string, field: 'bonusReason' | 'deductionReason', value: string) { this.payroll.upsertRecruiterAdjustment(this.payroll.currentPeriodId()!, id, { [field]: value }) }
}
