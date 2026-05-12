import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { catchError, map, of, switchMap } from 'rxjs';
import { SessionService } from '../../services/session/session.service';

export const isLoggedGuard: CanActivateFn = (route, state) => {
    const sessionService = inject(SessionService);
    const router = inject(Router);

    // Si la sesión ya está en memoria, permitir acceso inmediatamente
    if (sessionService.isDefined()) {
        console.log('[IsLoggedGuard] Sesión en memoria. Permitiendo acceso a:', state.url);
        return true;
    }

    // Si no hay sesión en memoria, intentar recuperarla:
    // 1. Refrescar tokens para obtener un access token
    // 2. Obtener los datos de la sesión (user, tenant, etc)
    console.log('[IsLoggedGuard] Sin sesión en memoria. Intentando refrescar token...');
    return sessionService.refreshTokens().pipe(
        switchMap((refreshRes: any) => {
            if (!refreshRes?.tokens?.accessToken) {
                console.warn('[IsLoggedGuard] No se pudo obtener access token. Redirigiendo a login.');
                router.navigate(['/']);
                return of(false);
            }
            // Guardar token temporalmente en memoria para que getSession() u otros requests funcionen si lo necesitan,
            // aunque getSession usa cookies de todas formas.
            sessionService.setAccessToken(refreshRes.tokens.accessToken);

            console.log('[IsLoggedGuard] Token obtenido. Recuperando datos de sesión...');
            return sessionService.getSession().pipe(
                map((sessionRes: any) => {
                    if (sessionRes?.user) {
                        console.log('[IsLoggedGuard] Sesión recuperada. Setup y permitiendo acceso.');
                        // Construir el objeto completo que espera setupSession
                        const fullSession = {
                            ...sessionRes,
                            tokens: refreshRes.tokens,
                            currentTenant: sessionRes.currentTenant || sessionRes.tenant
                        };
                        sessionService.setupSession(fullSession);
                        return true;
                    }
                    console.warn('[IsLoggedGuard] Respuesta de sesión inválida. Redirigiendo a login.');
                    router.navigate(['/']);
                    return false;
                })
            );
        }),
        catchError((error) => {
            console.error('[IsLoggedGuard] Error al recuperar sesión/tokens:', error);
            router.navigate(['/']);
            return of(false);
        })
    );
};
