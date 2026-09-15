import { Component, Input, computed } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { PayrollService } from '../../core/payroll.service'
import { AuthService } from '../../core/auth.service'
import { calcStaff, formatEGP } from '../../core/calc'
import { StaffRow } from '../../core/models'

@Component({ selector: 'app-staff-dept', standalone: true, imports: [CommonModule, FormsModule], templateUrl: './staff-dept.component.html' })
export class StaffDeptComponent {
  @Input() dept!: 'management' | 'it'
  @Input() title = ''
  @Input() subtitle = ''
  formatEGP = formatEGP
  newName = ''
  constructor(public payroll: PayrollService, public auth: AuthService) {}
  employees = computed(() => this.dept === 'management' ? this.payroll.managementEmployees() : this.payroll.itEmployees())
  allRows = computed(() => this.dept === 'management' ? this.payroll.managementRows() : this.payroll.itRows())
  rows = computed(() => this.employees().map((emp) => {
    const row: StaffRow = this.allRows().find((r) => r.periodId === this.payroll.currentPeriodId() && r.employeeId === emp.id)
      || { periodId: this.payroll.currentPeriodId() || '', employeeId: emp.id, bonus: 0, deduction: 0 }
    return { emp, row, result: calcStaff(row, this.payroll.settings().managementItBaseSalary) }
  }))
  totals = computed(() => this.rows().reduce((sum, r) => ({ baseSalary: sum.baseSalary + r.result.baseSalary, bonus: sum.bonus + r.result.bonus, deduction: sum.deduction + r.result.deduction, total: sum.total + r.result.total }), { baseSalary: 0, bonus: 0, deduction: 0, total: 0 }))
  async addStaff() { if (this.newName.trim() && await this.payroll.performAction(() => this.payroll.addStaff(this.dept, this.newName.trim()))) this.newName = '' }
  onBonusBlur(id: string, value: string) { this.payroll.upsertStaffRow(this.dept, this.payroll.currentPeriodId()!, id, { bonus: Number(value) }) }
  onDeductionBlur(id: string, value: string) { this.payroll.upsertStaffRow(this.dept, this.payroll.currentPeriodId()!, id, { deduction: Number(value) }) }
  onReasonBlur(id: string, field: 'bonusReason' | 'deductionReason', value: string) { this.payroll.upsertStaffRow(this.dept, this.payroll.currentPeriodId()!, id, { [field]: value }) }
}