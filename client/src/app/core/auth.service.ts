import { Injectable, signal } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Router } from '@angular/router'
import { environment } from '../../environments/environment'
import { User } from './models'
import { firstValueFrom } from 'rxjs'

const TOKEN_KEY = 'golden-payroll-token'

@Injectable({ providedIn: 'root' })
export class AuthService {
  user = signal<User | null>(null)
  loading = signal(true)

  constructor(private http: HttpClient, private router: Router) {
    const token = this.getToken()
    if (!token) {
      this.loading.set(false)
      return
    }
    // Finish constructing AuthService before its interceptor resolves this service.
    queueMicrotask(() => {
    this.http.get<{ user: User }>(`${environment.apiUrl}/auth/me`).subscribe({
      next: (res) => { this.user.set(res.user); this.loading.set(false) },
      error: () => { this.clearToken(); this.loading.set(false) },
    })
    })
  }

  getToken() { return localStorage.getItem(TOKEN_KEY) }
  setToken(token: string) { localStorage.setItem(TOKEN_KEY, token) }
  clearToken() { localStorage.removeItem(TOKEN_KEY) }

  async login(email: string, password: string) {
    const res = await firstValueFrom(
      this.http.post<{ token: string; user: User }>(`${environment.apiUrl}/auth/login`, { email, password })
    )
    this.setToken(res.token)
    this.user.set(res.user)
  }

  async register(name: string, email: string, password: string) {
    const res = await firstValueFrom(
      this.http.post<{ token: string; user: User }>(`${environment.apiUrl}/auth/register`, { name, email, password })
    )
    this.setToken(res.token)
    this.user.set(res.user)
  }

  logout() {
    this.clearToken()
    this.user.set(null)
    this.router.navigate(['/login'])
  }

  canAccessGameTracker() { return this.isAdmin() || this.user()?.game_tracker_access === true }
  canCreateGameTracker() { return this.isAdmin() || this.canAccessGameTracker() && this.user()?.game_tracker_create === true }

  canManage() { return this.isAdmin() || this.user()?.role === 'management' }

  isAdmin() { return this.user()?.role === 'admin' }
}
