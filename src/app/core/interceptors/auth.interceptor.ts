import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, switchMap, throwError, of } from 'rxjs';
import { AuthService } from '../services/auth/auth.service';
import { environment } from '../../../environments/environment';

let isRefreshing = false;

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const token = authService.getAccessToken();
    const isApiRequest = req.url.startsWith(environment.middlewareBaseUrl);

    if (token && isApiRequest) {
        const cloned = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });

        return next(cloned).pipe(
            catchError((error) => {
                if (error.status === 401 && !req.url.includes('/auth/refresh')) {
                    if (!isRefreshing) {
                        isRefreshing = true;
                        return authService.refreshTokens().pipe(
                            switchMap((response: any) => {
                                isRefreshing = false;
                                if (response?.tokens?.accessToken) {
                                    authService.handleLoginResponse(response);
                                    const retryReq = req.clone({
                                        setHeaders: {
                                            Authorization: `Bearer ${response.tokens.accessToken}`,
                                        },
                                    });
                                    return next(retryReq);
                                }
                                authService.clearSession();
                                return throwError(() => error);
                            }),
                            catchError((refreshError) => {
                                isRefreshing = false;
                                authService.clearSession();
                                return throwError(() => refreshError);
                            }),
                        );
                    }
                    authService.clearSession();
                }
                return throwError(() => error);
            }),
        );
    }

    return next(req);
};
