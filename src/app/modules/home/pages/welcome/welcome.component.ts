import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { SdkService } from '../../../../core/services/sdk/sdk.service';
import { HeaderComponent, HeaderCta } from '../../../public/components/header/header.component';

@Component({
    selector: 'app-welcome',
    standalone: true,
    imports: [FormsModule, CommonModule, HeaderComponent],
    templateUrl: './welcome.component.html',
    styleUrls: ['./welcome.component.scss'],
})
export class WelcomeComponent {
    // CTAs dinámicos para el header
    headerCtas: HeaderCta[] = [
        { id: 'access-business', type: 'button', variant: 'ghost', label: 'Acceder a mi negocio' },
        { id: 'create-account', type: 'button', variant: 'primary', label: 'Crear cuenta' }
    ];

    constructor(
        private router: Router,
        private sdkService: SdkService
    ) {}

    /**
     * Maneja el click en cualquier CTA del header
     */
    onHeaderCta(ctaId: string): void {
        switch (ctaId) {
            case 'access-business':
                this.router.navigate(['/org']);
                break;
            case 'create-account':
                this.sdkService.openSignUp();
                break;
            default:
                console.log('CTA no manejado:', ctaId);
        }
    }

    openSignUp(): void {
        this.sdkService.openSignUp();
    }

    goToUserPortal(): void {
        this.router.navigateByUrl('portal-usuarios');
    }

    goToOrg(): void {
        this.router.navigate(['/org']);
    }
}
