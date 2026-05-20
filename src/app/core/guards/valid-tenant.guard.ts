import { Injectable } from '@angular/core';
import { ActivatedRouteSnapshot, CanActivate, Router, RouterStateSnapshot } from '@angular/router';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { TenantService } from '../services/tenant/tenant.service';

@Injectable({
  providedIn: 'root'
})
export class ValidTenantGuard implements CanActivate {
  constructor(
    private tenantService: TenantService,
    private router: Router
  ) { }

  canActivate(
    route: ActivatedRouteSnapshot,
    state: RouterStateSnapshot
  ): Observable<boolean> {
    const tenantSlug = route.paramMap.get('tenantSlug');
    const isFromUserPortal = state.url.startsWith('/portal-usuarios');

    if (!tenantSlug) {
      this.redirect(isFromUserPortal);
      return of(false);
    }



    return this.tenantService.getTenantBySlug(tenantSlug).pipe(
      map(tenant => {
        if (tenant) {
          return true;
        }
        this.redirect(isFromUserPortal);
        return false;
      }),
      catchError(() => {
        this.redirect(isFromUserPortal);
        return of(false);
      })
    );
  }
  redirect = (isFromUserPortal: boolean) => {
    if (isFromUserPortal) {
      this.router.navigate(['/portal-usuarios']);
    } else {
      this.router.navigate(['/org']);
    }

  }
}


