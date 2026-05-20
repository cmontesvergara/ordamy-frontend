import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { TenantService } from '../../../../core/services/tenant/tenant.service';
import { SdkService } from '../../../../core/services/sdk/sdk.service';
import { FrequentTenant, TenantSearchComponent } from '../../../../shared/components/tenant-search';
import { HeaderComponent, HeaderCta } from '../../components/header/header.component';

@Component({
  selector: 'app-portal-usuarios',
  standalone: true,
  imports: [CommonModule, TenantSearchComponent, HeaderComponent],
  templateUrl: './portal-usuarios.component.html',
  styleUrls: ['./portal-usuarios.component.scss']
})
export class PortalUsuariosComponent {
  // Empty frequent searches for portal (not needed here)
  frequentSearches: FrequentTenant[] = [];

  // Header CTAs configuration
  headerCtas: HeaderCta[] = [
    { id: 'business-label', type: 'label', label: '¿Eres un negocio?' },
    { id: 'create-account', type: 'button', variant: 'primary', label: 'Crear cuenta' }
  ];

  private router = inject(Router);
  private tenantService = inject(TenantService);
  private sdkService = inject(SdkService);

  onTenantSelected(tenant: FrequentTenant): void {
    if (tenant?.slug) {
      // Navigate to tenant-specific portal page
      this.router.navigate(['/portal-usuarios', tenant.slug]);
    }
  }

  onHeaderCta(ctaId: string): void {
    switch (ctaId) {
      case 'create-account':
        this.sdkService.openSignUp();
        break;
    }
  }

  goToOrg(): void {
    this.router.navigate(['/org']);
  }

  goToWelcome(): void {
    this.router.navigate(['/welcome']);
  }
}
