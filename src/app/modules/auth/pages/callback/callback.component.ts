import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { Permission, SessionService, User } from '../../../../core/services/session/session.service';
import { Tenant } from '../../../../shared/components/tenant-selector.component';
export interface ExchangeResponse {
    success: boolean;
    tokens: {
        accessToken: string;
        expiresIn: number;
    }
    user: User;
    currentTenant: Tenant & { permissions: Permission[] };
    relatedTenants: Tenant[];
}

@Component({
    selector: 'app-callback',
    standalone: true,
    templateUrl: './callback.component.html',
    styles: [`
    .callback-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      height: 100vh;
      gap: 1rem;
      font-family: 'Inter', system-ui, sans-serif;
      color: #666;
    }
    .loader {
      width: 40px;
      height: 40px;
      border: 3px solid #e0e0e0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `],
})
export class CallbackComponent implements OnInit {
    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private sessionService: SessionService,
    ) { }

    ngOnInit() {
        const payload = this.route.snapshot.queryParamMap.get('payload');
        const code = this.route.snapshot.queryParamMap.get('code');
        const codeVerifier = this.route.snapshot.queryParamMap.get('codeVerifier');

        if (payload) {
            // Hacer exchange directo usando el SessionService
            const exchangeUrl = `${(environment as any).middlewareBaseUrl}/api/auth/exchange`;

            fetch(exchangeUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                credentials: 'include',
                body: JSON.stringify({
                    payload: payload,
                    codeVerifier: codeVerifier
                })
            })
                .then(res => res.json())
                .then((response: ExchangeResponse) => {
                    if (response.success) {
                        this.sessionService.setupSession(response);
                        this.router.navigate(['/home']);
                    } else {
                        console.error('Exchange payload failed:', response);
                        this.router.navigate(['/']);
                    }
                })
                .catch((error: any) => {
                    console.error('Exchange payload error:', error);
                    this.router.navigate(['/']);
                });
            return;
        }

        console.error('No authorization code or payload received');
        this.router.navigate(['/']);
    }
}
