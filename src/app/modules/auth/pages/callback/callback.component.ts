import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth/auth.service';

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
        private authService: AuthService,
    ) { }

    ngOnInit() {
        const payload = this.route.snapshot.queryParamMap.get('payload');
        const code = this.route.snapshot.queryParamMap.get('code');
        const codeVerifier = this.route.snapshot.queryParamMap.get('codeVerifier');

        if (payload) {
            this.authService.exchangePayload(payload).subscribe({
                next: (response: any) => {
                    if (response.success) {
                        this.authService.handleLoginResponse(response);
                        this.router.navigate(['/home']);
                    } else {
                        console.error('Exchange payload failed:', response);
                        this.router.navigate(['/']);
                    }
                },
                error: (error: any) => {
                    console.error('Exchange payload error:', error);
                    this.router.navigate(['/']);
                },
            });
            return;
        }

        if (code && codeVerifier) {
            this.authService.exchangeCode(code, codeVerifier).subscribe({
                next: (response: any) => {
                    if (response.success) {
                        this.authService.handleLoginResponse(response);
                        this.router.navigate(['/home']);
                    } else {
                        console.error('Exchange failed:', response);
                        this.router.navigate(['/']);
                    }
                },
                error: (error: any) => {
                    console.error('Exchange error:', error);
                    this.router.navigate(['/']);
                },
            });
            return;
        }

        console.error('No authorization code or payload received');
        this.router.navigate(['/']);
    }
}
