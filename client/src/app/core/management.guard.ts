import {inject} from '@angular/core'
import {CanActivateFn,Router} from '@angular/router'
import {AuthService} from './auth.service'
export const managementGuard:CanActivateFn=()=>inject(AuthService).canManage()||inject(Router).createUrlTree(['/attendance'])
