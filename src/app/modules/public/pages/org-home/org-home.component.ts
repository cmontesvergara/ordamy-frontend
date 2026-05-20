import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { Tenant, TenantService } from '../../../../core/services/tenant/tenant.service';
import { FooterComponent } from "../../components/footer";
import { HeaderComponent, HeaderCta } from "../../components/header/header.component";
import { TenantSearchComponent, FrequentTenant } from '../../../../shared/components/tenant-search';

@Component({
  selector: 'app-org-home',
  standalone: true,
  imports: [CommonModule, FooterComponent, TenantSearchComponent, HeaderComponent],
  templateUrl: './org-home.component.html',
  styleUrls: ['../../_tracker.scss']
})
export class OrgHomeComponent implements OnInit {
  // Mock data for frequent searches
  private mockFrequentSearches: FrequentTenant[] = [
    // { id: '1', name: 'Centro Color', slug: 'centro-color', color: '#2563eb' },
    { id: '2', name: 'Jaider Publicidad', slug: 'jaider-publicidad', color: '#d97706' },
    { id: '3', name: 'Big Print', slug: 'big-solutions', color: '#8c06d9' },
  ];

  // Cached frequent searches to avoid recalculation on every change detection
  frequentSearches: FrequentTenant[] = [];

  ngOnInit(): void {
    this.calculateFrequentSearches();
  }

  // Header CTAs configuration
  headerCtas: HeaderCta[] = [
    { id: 'business-label', type: 'label', label: '¿Aún no eres proveedor?' },
    { id: 'register', type: 'button', variant: 'primary', label: 'Registrarse' }
  ];

  onHeaderCta(ctaId: string): void {
    switch (ctaId) {
      case 'business-label':
        this.goToWelcome();
        break;
      case 'register':
        this.goToWelcome();
        break;
    }
  }

  private calculateFrequentSearches(): void {
    const stored = this.tenantService.getStoredTenantInfo();
    if (stored) {
      // Add stored tenant at the beginning if not already in the list
      const storedAsFrequent: FrequentTenant = {
        id: stored.id,
        name: stored.name,
        slug: stored.slug,
        color: '#e05a20'
      };
      // Check if already exists to avoid duplicates
      const exists = this.mockFrequentSearches.some(t => t.slug === stored.slug);
      this.frequentSearches = exists ? [...this.mockFrequentSearches] : [storedAsFrequent, ...this.mockFrequentSearches];
    } else {
      this.frequentSearches = [...this.mockFrequentSearches];
    }
  }

  constructor(
    private router: Router,
    private tenantService: TenantService
  ) { }

  onTenantSelected(tenant: FrequentTenant): void {
    console.log('[OrgHome] Selecting tenant:', tenant);
    if (tenant?.slug) {
      this.router.navigate(['/org', tenant.slug]);
    } else {
      console.error('[OrgHome] Tenant slug is missing:', tenant);
    }
  }

  goToWelcome(): void {
    this.router.navigate(['/welcome']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }
}
