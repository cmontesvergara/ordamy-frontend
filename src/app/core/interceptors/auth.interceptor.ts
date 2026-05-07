import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Subject, catchError, filter, switchMap, take, throwError } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from '../services/session/session.service';
import { ToastService } from '../services/toast/toast.service';

// Estado global para manejar el refresh
let isRefreshing = false;
let refreshSubject: Subject<string> | null = null;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const sessionService = inject(SessionService);
    const toastService = inject(ToastService);
    const token = sessionService.getAccessToken();
    const isApiRequest = req.url.startsWith(environment.middlewareBaseUrl);
    const isAuthRequest = req.url.includes('/auth/') || req.url.includes('/api/auth/');

    // Si no es request a nuestra API, no agregamos token
    if (!isApiRequest) {
        console.log('[AuthInterceptor] No se agrega token a request externo:', req.url);
        return next(req);
    }

    // Si es un request de auth, no agregamos Authorization pero sí pasamos otros headers
    if (isAuthRequest) {
        console.log('[AuthInterceptor] Request de auth, manteniendo headers existentes:', req.url);
        return next(req);
    }

    // Si no hay token, hacer el request sin token
    if (!token) {
        console.warn('[AuthInterceptor] No se encontró token para request:', req.url);
        return next(req);
    }

    // Clonar request con el token
    const cloned = req.clone({
        setHeaders: {
            Authorization: `Bearer ${token}`,
        },
    });

    return next(cloned).pipe(
        catchError((error) => {
            console.error('[AuthInterceptor] Error en request:', req.url, 'Error:', error);
            // Si es 401 y no estamos ya en un request de refresh
            if (error.status === 401 && !isAuthRequest) {
                console.warn('[AuthInterceptor] 401 detectado para:', req.url);
                // Si ya estamos refrescando, esperar al nuevo token
                if (isRefreshing && refreshSubject) {
                    console.log('[AuthInterceptor] Esperando nuevo token para:', req.url);
                    return refreshSubject.pipe(
                        filter((newToken): newToken is string => !!newToken),
                        take(1),
                        switchMap((newToken) => {
                            const retryReq = req.clone({
                                setHeaders: {
                                    Authorization: `Bearer ${newToken}`,
                                },
                            });
                            return next(retryReq);
                        })
                    );
                }

                // Iniciar proceso de refresh
                isRefreshing = true;
                refreshSubject = new Subject<string>();

                return sessionService.refreshTokens().pipe(
                    switchMap((response: any) => {
                        if (response?.tokens.accessToken) {
                            console.log('[AuthInterceptor] Token actualizado para:', req.url);
                            sessionService.setAccessToken(response.tokens.accessToken);
                            
                            // Notificar al usuario que la sesión fue renovada
                            toastService.success('Sesión renovada', 'Tu sesión ha sido actualizada automáticamente.');

                            // Notificar a los requests en espera
                            refreshSubject?.next(response.tokens.accessToken);
                            refreshSubject?.complete();

                            // Resetear estado
                            isRefreshing = false;
                            refreshSubject = null;

                            // Reintentar request original
                            const retryReq = req.clone({
                                setHeaders: {
                                    Authorization: `Bearer ${response.tokens.accessToken}`,
                                },
                            });
                            return next(retryReq);
                        }

                        // Si no hay token, logout
                        refreshSubject?.error('No token in response');
                        sessionService.clearSession();
                        isRefreshing = false;
                        refreshSubject = null;
                        return throwError(() => error);
                    }),
                    catchError((refreshError) => {
                        console.error('[AuthInterceptor] Error al refrescar token:', refreshError);
                        // Si el refresh falla, logout
                        refreshSubject?.error(refreshError);
                        sessionService.clearSession();
                        isRefreshing = false;
                        refreshSubject = null;
                        return throwError(() => refreshError);
                    })
                );
            }

            return throwError(() => error);
        }),
    );
};
