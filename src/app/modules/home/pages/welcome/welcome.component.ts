import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { BigsoAuth } from '@bigso/auth-sdk';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-welcome',
    standalone: true,
    templateUrl: './welcome.component.html',
    styleUrls: [],
})
export class WelcomeComponent {
    private auth: BigsoAuth;

    constructor(private router: Router) {
        this.auth = new BigsoAuth({
            clientId: environment.appId,
            ssoOrigin: environment.ssoPortalUrl,
            jwksUrl: environment.jwksUrl,
            debug: !environment.production,
            theme: 'light',
        });
    }

    async openSSO() {
        try {
            const result = await this.auth.login();
            console.log('[Ordamy] SSO login exitoso:', result);

            // Navegar al callback con el signed_payload para que el middleware lo valide
            this.router.navigate(['/auth/callback'], {
                queryParams: { payload: result.signed_payload || JSON.stringify(result) }
            });
        } catch (error: any) {
            if (error?.message === 'Login aborted' || error?.message === 'Login cancelled by user') {
                console.log('[Ordamy] Login cancelado por el usuario');
                return;
            }
            console.error('[Ordamy] SSO login error:', error);
            // Fallback: el SDK ya maneja el redirect en caso de timeout
        }
    }
}
