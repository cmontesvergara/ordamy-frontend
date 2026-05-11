import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Subject, catchError, filter, switchMap, take, throwError, timeout } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SessionService } from '../services/session/session.service';
import { ToastService } from '../services/toast/toast.service';

// Estado global para manejar el refresh
let isRefreshing = false;
let refreshSubject: Subject<string> | null = null;
let refreshAttempts = 0;
const MAX_REFRESH_ATTEMPTS = 3;

// Reset estado function
const resetRefreshState = () => {
    isRefreshing = false;
    refreshSubject = null;
    refreshAttempts = 0;
};

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const sessionService = inject(SessionService);
    const toastService = inject(ToastService);
    const token = sessionService.getAccessToken();
    const isApiRequest = req.url.startsWith(environment.middlewareBaseUrl);
    const isAuthRequest = req.url.includes('/auth/') || req.url.includes('/api/auth/');
    const isRefreshRequest = req.url.includes('/auth/refresh');

    // Si no es request a nuestra API, no agregamos token
    if (!isApiRequest) {
        return next(req);
    }

    // Si es un request de auth o refresh, no agregamos Authorization
    if (isAuthRequest) {
        return next(req);
    }

    // Determinar si tenemos token y crear el request apropiado
    let requestToSend = req;
    if (token) {
        // Clonar request con el token
        requestToSend = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    } else {
        console.warn('[AuthInterceptor] No hay access token, intentando con cookies...');
    }

    // Handler para errores 401 y refresh
    const handle401Error = (error: any) => {
        console.error('[AuthInterceptor] Error:', error.status, error.message, 'URL:', req.url);
        
        // Si es 401, intentar refresh
        if (error.status === 401) {
            console.warn('[AuthInterceptor] 401 detectado');
            
            // Si es el request de refresh mismo que falló, no intentar de nuevo
            if (isRefreshRequest) {
                console.error('[AuthInterceptor] Refresh request failed with 401');
                resetRefreshState();
                sessionService.clearSession();
                window.location.href = '/auth/login';
                return throwError(() => error);
            }

            // Si ya estamos refrescando, esperar al nuevo token
            if (isRefreshing && refreshSubject) {
                console.log('[AuthInterceptor] Esperando refresh en progreso...');
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
                    }),
                    catchError(() => {
                        // Si el refresh falló, redirigir a login
                        window.location.href = '/auth/login';
                        return throwError(() => error);
                    })
                );
            }

            // Limitar intentos de refresh
            if (refreshAttempts >= MAX_REFRESH_ATTEMPTS) {
                console.error('[AuthInterceptor] Max refresh attempts reached');
                resetRefreshState();
                sessionService.clearSession();
                window.location.href = '/auth/login';
                return throwError(() => error);
            }

            // Iniciar proceso de refresh
            console.log('[AuthInterceptor] Iniciando refresh de token...');
            isRefreshing = true;
            refreshAttempts++;
            refreshSubject = new Subject<string>();

            return sessionService.refreshTokens().pipe(
                timeout(10000), // 10 second timeout
                switchMap((response: any) => {
                    console.log('[AuthInterceptor] Refresh exitoso:', response);
                    
                    if (response?.tokens?.accessToken) {
                        // Guardar nuevo token
                        sessionService.setAccessToken(response.tokens.accessToken);
                        
                        // Notificar éxito
                        refreshSubject?.next(response.tokens.accessToken);
                        refreshSubject?.complete();
                        resetRefreshState();

                        // Reintentar request original
                        const retryReq = req.clone({
                            setHeaders: {
                                Authorization: `Bearer ${response.tokens.accessToken}`,
                            },
                        });
                        return next(retryReq);
                    }

                    // No hay token en respuesta
                    throw new Error('No access token in refresh response');
                }),
                catchError((refreshError) => {
                    console.error('[AuthInterceptor] Refresh falló:', refreshError);
                    
                    // Notificar error
                    refreshSubject?.error(refreshError);
                    resetRefreshState();
                    
                    // Limpiar sesión y redirigir
                    sessionService.clearSession();
                    
                    // Mostrar mensaje al usuario
                    toastService.error('Sesión expirada', 'Por favor inicia sesión nuevamente');
                    
                    // Redirigir a login después de un momento
                    setTimeout(() => {
                        window.location.href = '/auth/login';
                    }, 2000);
                    
                    return throwError(() => refreshError);
                })
            );
        }

        // Otros errores, propagar
        return throwError(() => error);
    };

    // Ejecutar el request con el handler de errores 401
    return next(requestToSend).pipe(
        catchError(handle401Error)
    );
};
