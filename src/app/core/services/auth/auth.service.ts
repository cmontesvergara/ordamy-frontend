import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';
import { switchMap, catchError } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private accessTokenKey = 'ordamy_access_token';
    private authState$ = new BehaviorSubject<boolean>(false);

    constructor(private readonly http: HttpClient) {
        this.authState$.next(!!this.getAccessToken());
    }

    get isAuthenticated$() {
        return this.authState$.asObservable();
    }

    getAccessToken(): string | null {
        return localStorage.getItem(this.accessTokenKey);
    }

    private setAccessToken(token: string | null) {
        if (token) {
            localStorage.setItem(this.accessTokenKey, token);
        } else {
            localStorage.removeItem(this.accessTokenKey);
        }
        this.authState$.next(!!token);
    }

    exchangePayload(signedPayload: string, codeVerifier?: string) {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/exchange-v2`,
            { payload: signedPayload, codeVerifier },
            { withCredentials: true }
        );
    }

    exchangeCode(code: string, codeVerifier: string) {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/exchange`,
            { code, codeVerifier },
            { withCredentials: true }
        );
    }

    getSession() {
        if ((environment as any).mockAuth) {
            return of({
                user: {
                    userId: 'local-bypass',
                    id: 'local-bypass',
                    email: 'admin@ordamy.local',
                    firstName: 'Admin',
                    lastName: 'LocalBypass',
                },
                tenant: {
                    id: 'local-tenant',
                    name: 'Ordamy Local',
                    slug: 'ordamy-local',
                }
            });
        }
        return this.http.get(`${environment.middlewareBaseUrl}/api/auth/session`, { withCredentials: true });
    }

    /**
     * Get session with automatic refresh handling.
     * If the response contains refreshRequired: true, it will automatically
     * call refreshTokens() and then retry getting the session.
     * This is useful for components that need to ensure the token is fresh.
     */
    getSessionWithAutoRefresh() {
        return this.getSession().pipe(
            switchMap((response: any) => {
                if (response?.refreshRequired) {
                    console.log('🔄 Session indicates refresh required, refreshing token...');
                    return this.refreshTokens().pipe(
                        switchMap(() => {
                            // After successful refresh, get session again
                            return this.getSession();
                        }),
                        catchError((error) => {
                            console.error('❌ Token refresh failed:', error);
                            // If refresh fails, return the original response
                            // The caller can decide what to do
                            return of(response);
                        })
                    );
                }
                return of(response);
            })
        );
    }

    refreshTokens() {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/refresh`,
            {},
            { withCredentials: true }
        );
    }

    logout() {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/logout`,
            {},
        );
    }

    handleLogout() {
        this.setAccessToken(null);
    }

    clearSession() {
        this.setAccessToken(null);
    }

    handleLoginResponse(response: any) {
        if (response?.success && response?.tokens?.accessToken) {
            this.setAccessToken(response.tokens.accessToken);
        }
    }
}
