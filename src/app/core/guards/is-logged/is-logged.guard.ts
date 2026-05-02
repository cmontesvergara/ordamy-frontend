import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { SessionService } from '../../services/session/session.service';

export const isLoggedGuard: CanActivateFn = (route, state) => {
    const sessionService = inject(SessionService);
    const router = inject(Router);

    // Si la sesión ya está en memoria, permitir acceso inmediatamente
    if (sessionService.isDefined()) {
        console.log('[IsLoggedGuard] Sesión en memoria. Permitiendo acceso a:', state.url);
        return true;
    }

    // Si no hay sesión en memoria, intentar recuperarla del servidor
    console.log('[IsLoggedGuard] Sin sesión en memoria. Intentando recuperar del servidor...');
    return sessionService.getSession().pipe(
        map((response: any) => {
            if (response?.user && response?.tokens?.accessToken) {
                console.log('[IsLoggedGuard] Sesión recuperada. Setup y permitiendo acceso.');
                sessionService.setupSession(response);
                return true;
            }
            // Respuesta inválida, redirigir
            console.warn('[IsLoggedGuard] Respuesta de sesión inválida. Redirigiendo a login.');
            router.navigate(['/']);
            return false;
        }),
        catchError((error) => {
            console.error('[IsLoggedGuard] Error al recuperar sesión:', error);
            router.navigate(['/']);
            return of(false);
        })
    );
};
