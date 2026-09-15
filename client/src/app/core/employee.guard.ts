import {inject} from '@angular/core'
import {CanActivateFn,CanActivateChildFn,Router} from '@angular/router'
import {AuthService} from './auth.service'
async function ready(auth:AuthService){while(auth.loading())await new Promise(r=>setTimeout(r,20))}
export const employeeAdminGuard:CanActivateFn=async()=>{const auth=inject(AuthService),router=inject(Router);await ready(auth);return auth.isAdmin()||router.createUrlTree(['/attendance'])}
export const employeeScopeGuard:CanActivateChildFn=async route=>{const auth=inject(AuthService),router=inject(Router);await ready(auth);if(!auth.user())return router.createUrlTree(['/login']);return auth.user()?.role!=='employee'||route.routeConfig?.path==='attendance'||router.createUrlTree(['/attendance'])}
