import { Component, computed, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { PayrollService } from '../../core/payroll.service'

const TIER_LABELS: Record<number, string> = {
  1: 'Tier 1 — Special',
  2: 'Tier 2 — Very Very Good',
  3: 'Tier 3 — Very Good',
  4: 'Tier 4 — Good',
  5: 'Tier 5 — Rejected',
}

@Component({
  selector: 'app-recruiting-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './recruiting-list.component.html',
})
export class RecruitingListComponent {
  tierLabels = TIER_LABELS
  tierKeys = [1, 2, 3, 4, 5]

  form = { recruiterId: '', user: '', tier: 3, score: '' }

  constructor(public payroll: PayrollService) {
    const first = this.payroll.recruiters()[0]
    if (first) this.form.recruiterId = first.id
  }

  records = computed(() =>
    this.payroll.recruitingRecords().filter((r) => r.periodId === this.payroll.currentPeriodId())
  )

  recruiterName(id: string) {
    return this.payroll.recruiters().find((r) => r.id === id)?.name || '—'
  }

  addRecord() {
    if (!this.form.recruiterId || !this.form.user.trim()) return
    this.payroll.addRecruitingRecord(this.payroll.currentPeriodId()!, {
      recruiterId: this.form.recruiterId,
      user: this.form.user.trim(),
      tier: Number(this.form.tier),
      score: Number(this.form.score) || 0,
      days: 0,
      hours: 0,
    })
    this.form.user = ''
    this.form.score = ''
  }

  removeRecord(id: string) {
    this.payroll.removeRecruitingRecord(id)
  }
}
