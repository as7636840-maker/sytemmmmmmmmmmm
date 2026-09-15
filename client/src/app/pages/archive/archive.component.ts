import { Component, OnInit, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { HttpClient } from '@angular/common/http'
import { firstValueFrom } from 'rxjs'
import { environment } from '../../../environments/environment'

@Component({
  selector: 'app-archive', standalone: true, imports: [CommonModule],
  template: `
    <h1 class="text-xl font-semibold mb-1">الأرشيف</h1>
    <p class="text-sm text-ink-500 mb-5">فترات الرواتب المقفولة — للعرض فقط.</p>
    <div class="grid grid-cols-1 lg:grid-cols-[16rem_1fr] gap-5">
      <aside class="bg-base-900 border border-base-700 rounded-lg p-3"><button *ngFor="let p of periods()" (click)="load(p._id)" class="w-full text-right rounded p-3 hover:bg-base-800" [ngClass]="{'bg-gold-500/10': data()?.period?._id === p._id}">{{ p.label }}</button><p *ngIf="!periods().length" class="text-ink-500 p-2">لا توجد فترات مقفولة.</p></aside>
      <main *ngIf="data() as d; else choose" class="space-y-5">
        <h2 class="text-lg font-semibold">{{ d.period.label }}</h2>
        <section class="panel"><h3>الستريمرز</h3><table><tr><th>الاسم</th><th>Rate (snapshot)</th><th>Score</th><th>Days</th><th>Hours</th><th>Bonus / reason</th><th>Deduction / reason</th></tr><tr *ngFor="let r of d.streamers"><td>{{r.streamer?.name}}</td><td>{{r.rateSnapshot}}</td><td>{{r.score}}</td><td>{{r.days}}</td><td>{{r.hours}}</td><td>{{r.bonus}} — {{r.bonusReason}}</td><td>{{r.deduction}} — {{r.deductionReason}}</td></tr></table></section>
        <section class="panel"><h3>Recruiters</h3><pre>{{ {records:d.recruitingRecords, adjustments:d.recruiterAdjustments} | json }}</pre></section>
        <section class="panel"><h3>Management / IT adjustments</h3><pre>{{ d.staffRows | json }}</pre></section>
        <section class="panel"><h3>Expenses</h3><pre>{{ d.expenses | json }}</pre></section>
        <section class="panel"><h3>Attendance</h3><pre>{{ d.attendance | json }}</pre></section>
        <section class="panel"><h3>Game Tracker</h3><pre>{{ d.gameTracker | json }}</pre></section>
        <section class="panel"><h3>Management problems</h3><pre>{{ d.problems | json }}</pre></section>
      </main>
      <ng-template #choose><div class="text-ink-500">اختر فترة مقفولة لعرض سجلاتها.</div></ng-template>
    </div>`,
  styles: [`.panel{background:#171717;border:1px solid #3f3f46;border-radius:.5rem;padding:1rem;overflow:auto}.panel h3{font-weight:600;margin-bottom:.75rem}table{width:100%;font-size:.875rem}th,td{padding:.5rem;text-align:right;border-bottom:1px solid #333}pre{white-space:pre-wrap;font-size:.75rem}`],
})
export class ArchiveComponent implements OnInit {
  periods = signal<any[]>([]); data = signal<any>(null)
  constructor(private http: HttpClient) {}
  async ngOnInit() { this.periods.set(await firstValueFrom(this.http.get<any[]>(environment.apiUrl + '/archive/periods'))) }
  async load(id: string) { this.data.set(await firstValueFrom(this.http.get<any>(environment.apiUrl + '/archive/' + id))) }
}
