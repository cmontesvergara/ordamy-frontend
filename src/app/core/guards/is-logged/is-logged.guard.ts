import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AuthService } from '../../services/auth/auth.service';

export const isLoggedGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);

    return authService.getSession().pipe(
        map((session: any) => {
            if (session && session.user && session.user.userId) {
                return true;
            }
            redirectToSSO();
            return false;
        }),
        catchError(() => {
            redirectToSSO();
            return of(false);
        }),
    );
};

function redirectToSSO(): void {
    const ssoUrl = environment.ssoUrl;
    const appId = environment.appId;
    const redirectUri = encodeURIComponent(environment.callbackUrl);
    window.location.href = `${ssoUrl}?app_id=${appId}&redirect_uri=${redirectUri}`;
}
