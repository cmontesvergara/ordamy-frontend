import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { of } from 'rxjs';
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
            `${environment.middlewareBaseUrl}/api/auth/exchange`,
            { code },
            { withCredentials: true },
        );
    }

    /**
     * Get current session info (validates cookie via middleware → SSO)
     */
    getSession() {
        if ((environment as any).mockAuth) {
            return of({
                user: {
                    userId: 'local-bypass',
                    id: 'local-bypass',
                    email: 'admin@ordamy.local',
                    firstName: 'Admin',
                    lastName: 'LocalBypass',
                    isSuperAdmin: true,
                },
                tenant: {
                    id: 'local-tenant',
                    name: 'Ordamy Local',
                    slug: 'ordamy-local',
                    permissions: []
                }
            });
        }
        return this.http.get(`${environment.middlewareBaseUrl}/api/auth/session`, {
            withCredentials: true,
        });
    }

    /**
     * Logout: revoke session in SSO and clear cookie
     */
    logout() {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/logout`,
            {},
            { withCredentials: true },
        );
    }
}
