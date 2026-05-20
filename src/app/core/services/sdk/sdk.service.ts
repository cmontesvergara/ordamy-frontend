import { Injectable } from '@angular/core';
import { Router } from '@angular/router';
import { BigsoAuth } from '@bigso/auth-sdk';
import { BehaviorSubject, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export type SdkModalType = 'signup' | 'login' | null;

@Injectable({
    providedIn: 'root',
})
export class SdkService {
    private activeModalSubject = new BehaviorSubject<SdkModalType>(null);
    public activeModal$: Observable<SdkModalType> = this.activeModalSubject.asObservable();
    constructor(private router: Router) { }
    /**
     * Abre un modal específico
     */
    openModal(modal: SdkModalType): void {
        this.activeModalSubject.next(modal);
    }

    /**
     * Cierra cualquier modal abierto
     */
    closeModal(): void {
        this.activeModalSubject.next(null);
    }

    /**
     * Abre el signup
     */
    openSignUp(): void {
        this.openModal('signup');
    }




    async login(tenantId: string): Promise<void> {



        try {


            const auth = new BigsoAuth({
                clientId: environment.appId,
                ssoOrigin: environment.ssoPortalUrl,
                jwksUrl: environment.jwksUrl,
                debug: !environment.production,
                theme: 'light',
                timeout: 300000,
                redirectUri: `${environment.baseUrl}/auth/callback`,
                tenantId: tenantId,
            });

            const result = await auth.login();
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
