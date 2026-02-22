import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    constructor(private readonly http: HttpClient) { }

    /**
     * Exchange authorization code for session token via middleware
     */
    exchangeCode(code: string) {
        return this.http.post(
            `${environment.authApiUrl}/api/auth/exchange`,
            { code },
            { withCredentials: true },
        );
    }

    /**
     * Get current session info (validates cookie via middleware → SSO)
     */
    getSession() {
        return this.http.get(`${environment.authApiUrl}/api/auth/session`, {
            withCredentials: true,
        });
    }

    /**
     * Logout: revoke session in SSO and clear cookie
     */
    logout() {
        return this.http.post(
            `${environment.authApiUrl}/api/auth/logout`,
            {},
            { withCredentials: true },
        );
    }
}
