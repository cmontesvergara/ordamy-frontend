import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { PublicOrderService, PublicTenantInfo } from '../../../../core/services/public/public-order.service';
import { environment } from '../../../../../environments/environment';

@Component({
  selector: 'app-customer-validate',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './customer-validate.component.html',
  styleUrls: ['../../_tracker.scss']
})
export class CustomerValidateComponent implements OnInit {
  tenantSlug = '';
  tenant: PublicTenantInfo | null = null;
  phone = '';
  loading = false;
  loadingTenant = true;
  tenantError = false;
  submitted = false;
  apiError = '';
  showNoResults = false;

  get initials(): string {
    const name = this.tenant?.name || this.tenantSlug;
    return name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('');
  }

  get tenantWhatsapp(): string | null {
    if (this.tenant?.whatsapp) return this.tenant.whatsapp;
    if (this.tenant?.settings?.contact) {
      const wa = this.tenant.settings.contact.find(c => c.name.toLowerCase() === 'whatsapp');
      if (wa && wa.value) return wa.value;
    }
    return null;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicOrderService: PublicOrderService,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') || '';
    this.resolveTenant();
  }

  private resolveTenant(): void {
    this.http.get<any>(`${environment.middlewareBaseUrl}/api/tenants/public/${this.tenantSlug}`).subscribe({
      next: (data) => {
        if (data.success && data.data) {
          this.tenant = { 
            name: data.data.name, 
            slug: data.data.slug, 
            phone: null, 
            email: null, 
            whatsapp: null,
            settings: data.data.settings
          };
        } else {
          this.tenantError = true;
        }
        this.loadingTenant = false;
      },
      error: () => {
        this.tenantError = true;
        this.loadingTenant = false;
      }
    });
  }

  validate(): void {
    this.submitted = true;
    this.apiError = '';
    this.showNoResults = false;
    if (!this.phone.trim()) return;

    this.loading = true;
    this.publicOrderService.getCustomerOrders(this.tenantSlug, this.phone.trim()).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          sessionStorage.setItem(`tracker_phone_${this.tenantSlug}`, this.phone.trim());
          sessionStorage.setItem(`tracker_customer_${this.tenantSlug}`, res.customer?.name || '');
          sessionStorage.setItem(`tracker_tenant_${this.tenantSlug}`, JSON.stringify(res.tenant));
          this.router.navigate(['/org', this.tenantSlug, 'pedidos']);
        } else {
          this.showNoResults = true;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 404) { this.showNoResults = true; }
        else if (err.status === 422) {
          this.apiError = err.error?.message || 'Tu perfil no tiene teléfono registrado.';
        } else if (err.status === 429) {
          this.apiError = 'Demasiados intentos. Espera un minuto e intenta de nuevo.';
        } else {
          this.apiError = 'Error al buscar pedidos. Intenta de nuevo.';
        }
      }
    });
  }

  reset(): void {
    this.showNoResults = false;
    this.submitted = false;
    this.apiError = '';
    this.phone = '';
  }
}
