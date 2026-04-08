import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of, BehaviorSubject } from 'rxjs';
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

    exchangePayload(signedPayload: string) {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/exchange-v2`,
            { payload: signedPayload },
        );
    }

    exchangeCode(code: string, codeVerifier: string) {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/exchange`,
            { code, codeVerifier },
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
        return this.http.get(`${environment.middlewareBaseUrl}/api/auth/session`);
    }

    refreshTokens() {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/refresh`,
            {},
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
