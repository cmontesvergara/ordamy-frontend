import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../../src/environments/environment';
import { Tenant, TenantService } from '../../../../core/services/tenant/tenant.service';
@Component({
    selector: 'app-welcome',
    standalone: true,
    imports: [FormsModule, CommonModule],
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent implements OnInit {
    // SSO Sign-up Iframe
    showSSOIframe: boolean = false;
    ssoSignUpUrl: SafeResourceUrl;

    // Tenant Search
    tenantSearchQuery: string = '';
    tenantResults: Tenant[] = [];
    selectedTenant: Tenant | null = null;
    isSearchingTenants: boolean = false;
    showTenantResults: boolean = false;
    searchError: string = '';
    private tenantSearchTimeout: any = null;

    constructor(
        private router: Router,
        private route: ActivatedRoute,
        private tenantService: TenantService,
        private sanitizer: DomSanitizer
    ) {
        // Sanitize the SSO iframe URL for embedding
        const baseUrl = environment.ssoPortalUrl || 'https://sso.bigso.test';
        this.ssoSignUpUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${baseUrl}/auth/iframe-sign-up`);
    }

    ngOnInit() {
        // Check if there's a stored tenant and redirect automatically
        const storedTenant = this.tenantService.getStoredTenantInfo();
        if (storedTenant) {
            console.log('[Welcome] Redirecting to stored tenant:', storedTenant.slug);
            this.router.navigate(['/auth/org', storedTenant.slug]);
        }
    }

    redirectToSSOSignUp() {
        // Open SSO sign-up in iframe overlay
        this.showSSOIframe = true;
    }

    closeSSOIframe() {
        this.showSSOIframe = false;
    }

    navigateToTenantAuth() {
        if (this.selectedTenant) {
            // Store tenant info before navigating
            this.tenantService.storeTenantInfo(this.selectedTenant);
            this.router.navigate(['/auth/org', this.selectedTenant.slug]);
        }
    }

    // Tenant Search Methods
    onSearchTenants() {
        // Clear previous timeout
        if (this.tenantSearchTimeout) {
            clearTimeout(this.tenantSearchTimeout);
        }

        this.selectedTenant = null;
        this.searchError = '';

        if (this.tenantSearchQuery.length < 2) {
            this.tenantResults = [];
            this.showTenantResults = false;
            return;
        }

        this.showTenantResults = true;
        this.isSearchingTenants = true;

        // Debounce search
        this.tenantSearchTimeout = setTimeout(() => {
            this.performSearch();
        }, 300);
    }

    private performSearch() {
        this.tenantService.searchTenants(this.tenantSearchQuery).subscribe({
            next: (tenants: Tenant[]) => {
                this.tenantResults = tenants;
                this.isSearchingTenants = false;
            },
            error: (error: any) => {
                console.error('[Welcome] Search error:', error);
                this.searchError = 'Error al buscar. Intenta de nuevo.';
                this.tenantResults = [];
                this.isSearchingTenants = false;
            }
        });
    }

    selectTenant(tenant: Tenant) {
        this.selectedTenant = tenant;
    }

    clearTenantSearch() {
        this.tenantSearchQuery = '';
        this.tenantResults = [];
        this.selectedTenant = null;
        this.showTenantResults = false;
        this.searchError = '';
    }

    scrollToTenantSearch() {
        const element = document.getElementById('access-tenant');
        if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'start' });
            // Focus on the search input after scrolling
            setTimeout(() => {
                const searchInput = element.querySelector('input[type="text"]') as HTMLInputElement;
                if (searchInput) {
                    searchInput.focus();
                }
            }, 500);
        }
    }
}
