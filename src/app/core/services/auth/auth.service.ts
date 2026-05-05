import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, of } from 'rxjs';
import { catchError, switchMap } from 'rxjs/operators';
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
            `${environment.middlewareBaseUrl}/api/auth/exchange`,
            { payload: signedPayload, codeVerifier },
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
                    systemRole: 'admin',
                },
                tenant: {
                    id: 'local-tenant',
                    name: 'Ordamy Local',
                    slug: 'ordamy-local',
                    permissions: [],
                }
            });
        }
        return this.http.get<any>(
            `${environment.middlewareBaseUrl}/api/auth/session`,
            { withCredentials: true }
        ).pipe(
            // Normalize API response shape for all components:
            //   user.systemRole is passed through as-is
            //   currentTenant  → tenant (alias)
            switchMap(raw => of(this.normalizeSession(raw))),
            catchError(err => { throw err; })
        );
    }

    private normalizeSession(raw: any): any {
        if (!raw?.success) return raw;
        const u = raw.user || {};
        return {
            ...raw,
            user: {
                ...u,
                userId: u.userId || u.id,
            },
            // alias currentTenant → tenant so existing components work
            tenant: raw.currentTenant || raw.tenant,
        };
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
