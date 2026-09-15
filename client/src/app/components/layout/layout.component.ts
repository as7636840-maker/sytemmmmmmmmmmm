import { takeUntilDestroyed } from '@angular/core/rxjs-interop'
import { Component, OnInit, effect, signal } from '@angular/core'
import { CommonModule } from '@angular/common'
import { FormsModule } from '@angular/forms'
import { NavigationEnd, Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router'
import { PayrollService } from '../../core/payroll.service'
import { AuthService } from '../../core/auth.service'

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './layout.component.html',
})
export class LayoutComponent implements OnInit {
  payrollExpanded = signal(false)
  payrollActive = signal(false)
  payrollNav = [
    { to: '/streamers', label: 'الستريمرز', icon: '▣' },
    { to: '/name-rates', label: 'الأسماء والنسب', icon: '%' },
    { to: '/recruiters', label: 'الريكروترز', icon: '◈' },
    { to: '/recruiting-list', label: 'سجل الريكروتينج', icon: '≡' },
    { to: '/management-payroll', label: 'الإدارة', icon: '◆' },
    { to: '/it', label: 'IT', icon: '◇' },
    { to: '/settings', label: 'الإعدادات', icon: '⚙' },
  ]

  adding = signal(false)
  newLabel = ''

  constructor(public payroll: PayrollService, public auth: AuthService, private router: Router) {
    const syncNavigation = () => {
      const path = this.router.url.split(/[?#]/)[0]
      const active = path === '/payroll' || this.payrollNav.some(item => item.to === path)
      this.payrollActive.set(active)
      if (active) this.payrollExpanded.set(true)
    }
    syncNavigation()
    this.router.events.pipe(takeUntilDestroyed()).subscribe(event => {
      if (event instanceof NavigationEnd) syncNavigation()
    })
    effect(() => {
      const id = this.payroll.currentPeriodId()
      if (id && this.auth.user()?.role !== 'employee') this.payroll.loadPeriodData(id)
    })
  }

  ngOnInit() {
    if (this.auth.user()?.role === 'employee') this.payroll.loading.set(false)
    else this.payroll.loadMasterData()
  }

  reopenPeriod() {
    const id = this.payroll.currentPeriodId()
    if (id) this.payroll.performAction(() => this.payroll.reopenPeriod(id))
  }

  onPeriodChange(id: string) {
    this.payroll.setCurrentPeriod(id)
  }

  async createPeriod() {
    if (this.newLabel.trim()) {
      const saved = await this.payroll.performAction(() => this.payroll.addPeriod(this.newLabel.trim()))
      if (!saved) return
      this.newLabel = ''
      this.adding.set(false)
    }
  }
}
