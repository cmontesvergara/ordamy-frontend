import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../environments/environment';

export interface Tenant {
    id: string;
    name: string;
    slug: string;
}

export interface TenantSearchResponse {
    success: boolean;
    data: Tenant[];
    count?: number;
    error?: string;
}

export interface TenantLookupResponse {
    success: boolean;
    data: Tenant;
    error?: string;
}

@Injectable({
    providedIn: 'root',
})
export class TenantService {
    private readonly baseUrl = `${environment.middlewareBaseUrl}/api/tenants`;

    constructor(private readonly http: HttpClient) { }

    /**
     * Decode tenant ID from base64
     * ONLY use this when passing to SSO SDK
     */
    decodeId(encodedId: string): string {
        if (!encodedId) return '';
        try {
            return atob(encodedId);
        } catch (e) {
            console.error('[TenantService] Error decoding ID:', e);
            return encodedId;
        }
    }

    /**
     * Search tenants by name or slug
     * Returns tenants with base64 encoded IDs (as received from backend)
     * Skips the global loading spinner - component handles its own loading state
     */
    searchTenants(query: string): Observable<Tenant[]> {
        if (!query || query.trim().length < 2) {
            return of([]);
        }

        const sanitizedQuery = query.trim().substring(0, 100);
        const headers = new HttpHeaders({ 'X-Skip-Loading': 'true' });

        return this.http
            .get<TenantSearchResponse>(`${this.baseUrl}/public/search?q=${encodeURIComponent(sanitizedQuery)}`, { headers })
            .pipe(
                map((response) => {
                    if (response.success) {
                        return response.data || [];
                    }
                    return [];
                }),
                catchError(() => of([]))
            );
    }

    /**
     * Get tenant by slug
     * Returns tenant with base64 encoded ID (as received from backend)
     * Skips the global loading spinner - component handles its own loading state
     */
    getTenantBySlug(slug: string): Observable<Tenant | null> {
        if (!slug || !/^[a-z0-9-]+$/.test(slug)) {
            return of(null);
        }

        const headers = new HttpHeaders({ 'X-Skip-Loading': 'true' });

        return this.http
            .get<TenantLookupResponse>(`${this.baseUrl}/public/${encodeURIComponent(slug)}`, { headers })
            .pipe(
                map((response) => {
                    if (response.success && response.data) {
                        return response.data;
                    }
                    return null;
                }),
                catchError(() => of(null))
            );
    }

    /**
     * Store tenant info in localStorage
     * ID is kept as base64 (as received from backend)
     */
    storeTenantInfo(tenant: Tenant): void {
        console.log('[TenantService] Storing tenant:', { 
            id: tenant.id, 
            isBase64: tenant.id.length > 20 && /^[A-Za-z0-9+/=]+$/.test(tenant.id),
            slug: tenant.slug 
        });
        localStorage.setItem('tenant_id', tenant.id);
        localStorage.setItem('tenant_slug', tenant.slug);
        localStorage.setItem('tenant_name', tenant.name);
    }

    /**
     * Get stored tenant info from localStorage
     * ID remains in base64 format
     */
    getStoredTenantInfo(): Tenant | null {
        const id = localStorage.getItem('tenant_id');
        const slug = localStorage.getItem('tenant_slug');
        const name = localStorage.getItem('tenant_name');

        if (id && slug && name) {
            return { id, slug, name };
        }

        return null;
    }

    /**
     * Get tenant ID for SSO SDK
     * This decodes the base64 ID for the SSO SDK
     */
    getTenantIdForSso(): string | null {
        const encodedId = localStorage.getItem('tenant_id');
        if (encodedId) {
            return this.decodeId(encodedId);
        }
        return null;
    }

    /**
     * Clear stored tenant info from localStorage
     */
    clearStoredTenantInfo(): void {
        localStorage.removeItem('tenant_id');
        localStorage.removeItem('tenant_slug');
        localStorage.removeItem('tenant_name');
    }
}
