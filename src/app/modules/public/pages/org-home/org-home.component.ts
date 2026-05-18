import { CommonModule } from '@angular/common';
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Tenant, TenantService } from '../../../../core/services/tenant/tenant.service';

interface FrequentTenant {
  id: string;
  name: string;
  slug: string;
  color: string;
}

@Component({
  selector: 'app-org-home',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './org-home.component.html',
  styleUrls: ['../../_tracker.scss']
})
export class OrgHomeComponent {
  searchQuery = '';
  tenants: Tenant[] = [];
  isSearching = false;
  showResults = false;
  searchError = '';
  private searchTimeout: any;

  // Mock data for frequent searches
  frequentSearches: FrequentTenant[] = [
    { id: '1', name: 'Centro Color', slug: 'centro-color', color: '#2563eb' },
    { id: '2', name: 'Jaider Publicidad', slug: 'jaider-publicidad', color: '#d97706' },
    { id: '3', name: 'Big Print', slug: 'big-solutions', color: '#8c06d9' },
  ];

  constructor(
    private router: Router,
    private tenantService: TenantService
  ) { }

  onSearch(): void {
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    this.searchError = '';

    if (this.searchQuery.length < 2) {
      this.tenants = [];
      this.showResults = false;
      return;
    }

    this.showResults = true;
    this.isSearching = true;

    this.searchTimeout = setTimeout(() => {
      this.performSearch();
    }, 300);
  }

  private performSearch(): void {
    this.tenantService.searchTenants(this.searchQuery).subscribe({
      next: (results) => {
        this.tenants = results;
        this.isSearching = false;
      },
      error: () => {
        this.searchError = 'Error al buscar. Intenta de nuevo.';
        this.tenants = [];
        this.isSearching = false;
      }
    });
  }

  selectTenant(tenant: Tenant | FrequentTenant): void {
    this.router.navigate(['/org', tenant.slug]);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.tenants = [];
    this.showResults = false;
    this.searchError = '';
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('');
  }

  goToWelcome(): void {
    this.router.navigate(['/welcome']);
  }

  goToLogin(): void {
    this.router.navigate(['/auth']);
  }
}
