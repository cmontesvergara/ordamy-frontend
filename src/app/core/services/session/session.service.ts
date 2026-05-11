import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { catchError, Observable, of, switchMap } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ExchangeResponse } from '../../../modules/auth/pages/callback/callback.component';

const STORAGE_KEY = `ordamy_session-${Date.now()}`;

export interface User {
    userId: string   // normalized from API's user.id
    email: string
    firstName: string
    lastName: string
    systemRole?: string
}

export interface Tenant {
    id: string
    name: string
    slug: string
    role: string
}

export interface Permission {
    resource: string;
    action: string;
}

@Injectable({
    providedIn: 'root',
})
export class SessionService {
    private accessToken: string | null = null;
    private user: User | null = null;
    private currentTenant: Tenant | null = null;
    private permissions: Permission[] | null = null;
    private relatedTenants: Tenant[] = [];

    constructor(private readonly http: HttpClient) {
        // Restore session from sessionStorage on initialization
        this.restoreFromStorage();
    }

    /**
     * Restore session data from sessionStorage
     */
    private restoreFromStorage() {
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.accessToken = data.accessToken || null;
                this.user = data.user || null;
                this.currentTenant = data.currentTenant || null;
                this.permissions = data.permissions || null;
                this.relatedTenants = data.relatedTenants || [];
            }
        } catch (error) {
            console.error('[SessionService] Error restoring from storage:', error);
        }
    }

    /**
     * Persist session data to sessionStorage
     */
    private persistToStorage() {
        try {
            const data = {
                accessToken: this.accessToken,
                user: this.user,
                currentTenant: this.currentTenant,
                permissions: this.permissions,
                relatedTenants: this.relatedTenants,
            };
            sessionStorage.setItem(STORAGE_KEY, JSON.stringify(data));
        } catch (error) {
            console.error('[SessionService] Error persisting to storage:', error);
        }
    }

    setupSession(data: ExchangeResponse) {
        this.setAccessToken(data.tokens.accessToken);
        // Normalize: API returns user.id but internal interface uses userId
        const rawUser = data.user as any;
        const user: User = {
            userId: rawUser.userId || rawUser.id,
            email: rawUser.email,
            firstName: rawUser.firstName,
            lastName: rawUser.lastName,
            systemRole: rawUser.systemRole,
        };
        this.setUser(user);
        this.setCurrentTenant(data.currentTenant);
        this.setRelatedTenants(data.relatedTenants || []);
        if (data.currentTenant?.permissions) {
            this.setPermissions(data.currentTenant.permissions);
        }
        // Persist to sessionStorage
        this.persistToStorage();
    }

    isDefined() {
        // Check both memory and sessionStorage
        const token = this.getAccessToken();
        return !!token && !!this.user && !!this.currentTenant && !!this.permissions;
    }

    setAccessToken(accessToken: string) {
        this.accessToken = accessToken;
        this.persistToStorage();
    }

    setUser(user: User) {
        this.user = user;
        this.persistToStorage();
    }

    setCurrentTenant(tenant: Tenant) {
        this.currentTenant = tenant;
        this.persistToStorage();
    }

    setRelatedTenants(tenants: Tenant[]) {
        this.relatedTenants = tenants;
        this.persistToStorage();
    }

    setPermissions(permissions: Permission[]) {
        this.permissions = permissions;
        this.persistToStorage();
    }

    getAccessToken() {
        // Return from memory, or from sessionStorage if memory is empty
        if (this.accessToken) {
            return this.accessToken;
        }
        // Try to get from sessionStorage
        try {
            const stored = sessionStorage.getItem(STORAGE_KEY);
            if (stored) {
                const data = JSON.parse(stored);
                this.accessToken = data.accessToken || null;
                return this.accessToken;
            }
        } catch (error) {
            console.error('[SessionService] Error reading from storage:', error);
        }
        return null;
    }

    getUser() {
        return this.user as User;
    }

    getCurrentTenant() {
        return this.currentTenant as Tenant;
    }

    getRelatedTenants() {
        return this.relatedTenants as Tenant[];
    }

    getPermissions() {
        return this.permissions as Permission[];
    }

    clearSession() {
        this.accessToken = null;
        this.user = null;
        this.currentTenant = null;
        this.permissions = null;
        this.relatedTenants = [];
        // Clear from sessionStorage
        try {
            sessionStorage.removeItem(STORAGE_KEY);
        } catch (error) {
            console.error('[SessionService] Error clearing storage:', error);
        }
    }

    refreshTokens(): Observable<any> {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/refresh`,
            {},
            { headers: { 'x-tenant-id': this.getCurrentTenant().id }, withCredentials: true }
        );
    }


    getSession() {
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

}
