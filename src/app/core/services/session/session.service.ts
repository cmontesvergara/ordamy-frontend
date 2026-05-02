import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { ExchangeResponse } from '../../../modules/auth/pages/callback/callback.component';

export interface User {
    userId: string
    email: string
    firstName: string
    lastName: string
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

    constructor(private readonly http: HttpClient) { }

    setupSession(data: ExchangeResponse) {
        this.setAccessToken(data.tokens.accessToken);
        this.setUser(data.user);
        this.setCurrentTenant(data.currentTenant);
        this.setRelatedTenants(data.relatedTenants);
        if (data.currentTenant.permissions) {
            this.setPermissions(data.currentTenant.permissions);
        }
    }

    isDefined() {
        return !!this.accessToken && !!this.user && !!this.currentTenant && !!this.permissions;
    }

    setAccessToken(accessToken: string) {
        this.accessToken = accessToken;
    }

    setUser(user: User) {
        this.user = user;
    }

    setCurrentTenant(tenant: Tenant) {
        this.currentTenant = tenant;
    }

    setRelatedTenants(tenants: Tenant[]) {
        this.relatedTenants = tenants;
    }

    setPermissions(permissions: Permission[]) {
        this.permissions = permissions;
    }

    getAccessToken() {
        return this.accessToken;
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
    }

    refreshTokens(): Observable<any> {
        return this.http.post(
            `${environment.middlewareBaseUrl}/api/auth/refresh`,
            {},
            { headers: { 'x-tenant-id': this.getCurrentTenant().id }, withCredentials: true }
        );
    }
    getSession() {
        return this.http.get(`${environment.middlewareBaseUrl}/api/auth/session`, { withCredentials: true });
    }
}
