import { Component } from '@angular/core';
import { Router } from '@angular/router';

@Component({
    selector: 'app-welcome',
    standalone: true,
    templateUrl: './welcome.component.html',
    styleUrls: [],
})
export class WelcomeComponent {
    constructor(private router: Router) {}

    openSSO() {
        if (typeof window !== 'undefined' && (window as any).SSOWidget) {
            (window as any).SSOWidget.open();
        } else {
            console.warn('SSO Widget no cargado aún. Redirigiendo a /auth/sign-in local...');
            this.router.navigate(['/auth/sign-in']);
        }
    }
}
