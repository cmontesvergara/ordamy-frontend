import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth/auth.service';

export const isLoggedGuard: CanActivateFn = (route, state) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    if (!authService.getAccessToken()) {
        router.navigate(['/']);
        return of(false);
    }

    // Usar getSessionWithAutoRefresh para manejar refreshRequired automáticamente
    return authService.getSessionWithAutoRefresh().pipe(
        map((session: any) => {
            if (session && session.user && session.user.userId) {
                return true;
            }
            router.navigate(['/']);
            return false;
        }),
        catchError(() => {
            authService.clearSession();
            router.navigate(['/']);
            return of(false);
        }),
    );
};
