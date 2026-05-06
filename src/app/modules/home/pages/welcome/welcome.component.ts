import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BigsoAuth } from '@bigso/auth-sdk/browser';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-welcome',
    standalone: true,
    templateUrl: './welcome.component.html',
    styleUrls: [],
})
export class WelcomeComponent implements OnInit {
    private auth: BigsoAuth;
    private tenantId: string;

    constructor(private router: Router, private route: ActivatedRoute,) {
        this.tenantId = this.route.snapshot.queryParams['tenant_id'] || '';
        this.auth = new BigsoAuth({
            clientId: environment.appId,
            ssoOrigin: environment.ssoPortalUrl,
            jwksUrl: environment.jwksUrl,
            debug: !environment.production,
            theme: 'light',
            timeout: 60000,
            redirectUri: `${environment.baseUrl}/auth/callback`,
            tenantId: this.tenantId,
        });
    }

    ngOnInit() {
        this.route.queryParams.subscribe(params => {
            const tenantId = params['tenant_id'];

            if (tenantId) {
                // Persist in localStorage
                localStorage.setItem('tenant_id', tenantId);
            } else {
                // If not in URL, check localStorage and inject if exists
                const storedTenantId = localStorage.getItem('tenant_id');
                if (storedTenantId) {
                    this.router.navigate([], {
                        relativeTo: this.route,
                        queryParams: { tenant_id: storedTenantId },
                        queryParamsHandling: 'merge',
                        replaceUrl: true
                    });
                }
            }
        });
    }

    async openSSO() {
        try {
            const result = await this.auth.login();
            console.log('[Ordamy] SSO login exitoso:', result);

            this.router.navigate(['/auth/callback'], {
                queryParams: {
                    payload: result.signed_payload,
                    codeVerifier: result.codeVerifier,
                }
            });
        } catch (error: any) {
            if (error?.message === 'Login aborted' || error?.message === 'Login cancelled by user') {
                console.log('[Ordamy] Login cancelado por el usuario');
                return;
            }
            console.error('[Ordamy] SSO login error:', error);
        }
    }
}
