import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PublicOrderService, PublicTenantInfo } from '../../../../core/services/public/public-order.service';
import { environment } from '../../../../../environments/environment';
import { HeaderComponent, HeaderCta } from '../../components/header/header.component';
import { SdkService } from '../../../../core/services/sdk/sdk.service';
import { Tenant, TenantService } from '../../../../core/services/tenant/tenant.service';

type CredentialType = 'document' | 'phone' | 'order';
type ViewState = 'loading' | 'form' | 'validating' | 'no-results' | 'error';

@Component({
  selector: 'app-portal-usuarios-tenant',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './portal-usuarios-tenant.component.html',
  styleUrls: ['./portal-usuarios.component.scss']
})
export class PortalUsuariosTenantComponent implements OnInit {
  // Header CTAs configuration
  headerCtas: HeaderCta[] = [
    { id: 'business-label', type: 'label', label: '¿Eres un negocio?' },
    { id: 'create-account', type: 'button', variant: 'primary', label: 'Crear cuenta' }
  ];

  tenant: Tenant | null = null;
  tenantInfo: PublicTenantInfo | null = null;
  tenantLogoUrl: string | null = null;
  tenantSlug = '';
  customerName = '';

  viewState: ViewState = 'loading';
  apiError = '';
  imageError = false;

  // Form state
  credentialType: CredentialType = 'document';
  credentialValue = '';
  submitted = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private tenantService: TenantService,
    private publicOrderService: PublicOrderService,
    private sdkService: SdkService
  ) { }

  onHeaderCta(ctaId: string): void {
    if (ctaId === 'create-account') {
      this.sdkService.openSignUp();
    }
  }

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') || '';

    if (this.tenantSlug) {
      this.loadTenant(this.tenantSlug);
    }
  }

  private loadTenant(slug: string): void {
    this.viewState = 'loading';

    this.tenantService.getTenantBySlug(slug).subscribe({
      next: (tenant) => {
        if (tenant) {
          this.tenant = tenant;
          this.tenantService.storeTenantInfo(tenant);

          // Build tenant info for display
          this.tenantInfo = {
            name: tenant.name,
            slug: tenant.slug,
            phone: null,
            email: null,
            whatsapp: null
          };

          // Load full tenant data with branding
          this.loadTenantBranding(slug);

          this.viewState = 'form';
        } else {
          this.viewState = 'error';
          this.apiError = 'El negocio no existe o no está disponible.';
        }
      },
      error: () => {
        this.viewState = 'error';
        this.apiError = 'Error al cargar la información del negocio.';
      }
    });
  }

  private loadTenantBranding(slug: string): void {
    this.http.get<any>(`${environment.middlewareBaseUrl}/api/tenants/public/${slug}`).subscribe({
      next: (data) => {
        if (data.success && data.data?.branding?.logo?.url) {
          this.tenantLogoUrl = data.data.branding.logo.url;
        }
      },
      error: () => {
        // Silently fail - logo is optional
      }
    });
  }

  setCredentialType(type: CredentialType): void {
    this.credentialType = type;
    this.credentialValue = '';
    this.submitted = false;
  }

  getPlaceholder(): string {
    switch (this.credentialType) {
      case 'document':
        return 'Ej: 1234567890';
      case 'phone':
        return 'Ej: 3001234567';
      case 'order':
        return 'Ej: ORD-123456';
      default:
        return '';
    }
  }

  getLabel(): string {
    switch (this.credentialType) {
      case 'document':
        return 'Documento de identidad';
      case 'phone':
        return 'Número de teléfono';
      case 'order':
        return 'Número de orden';
      default:
        return '';
    }
  }

  validateAndSearch(): void {
    this.submitted = true;

    if (!this.credentialValue.trim()) {
      return;
    }

    if (this.credentialType === 'order') {
      // For order number, go directly to order detail
      this.router.navigate(['portal-usuarios', this.tenantSlug, 'ordenes', this.credentialValue.trim()]);
      return;
    }

    // Validate phone or document and get orders
    this.viewState = 'validating';

    const phone = this.credentialType === 'phone' ? this.credentialValue.trim() : '';
    const document = this.credentialType === 'document' ? this.credentialValue.trim() : '';

    this.publicOrderService.getCustomerOrders(this.tenantSlug, phone, document).subscribe({
      next: (res) => {
        if (res.success && res.orders && res.orders.length > 0) {
          // Store session data and go to dashboard
          sessionStorage.setItem(`tracker_phone_${this.tenantSlug}`, phone);
          sessionStorage.setItem(`tracker_document_${this.tenantSlug}`, document);
          sessionStorage.setItem(`tracker_customer_${this.tenantSlug}`, res.customer?.name || '');
          sessionStorage.setItem(`tracker_tenant_${this.tenantSlug}`, JSON.stringify(res.tenant || this.tenantInfo));

          this.router.navigate(['portal-usuarios', this.tenantSlug, 'dashboard']);
        } else {
          this.viewState = 'no-results';
        }
      },
      error: () => {
        this.viewState = 'no-results';
      }
    });
  }

  retry(): void {
    this.viewState = 'form';
    this.credentialValue = '';
    this.submitted = false;
  }

  changeTenant(): void {
    this.router.navigate(['portal-usuarios']);
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('');
  }

  get displayImageUrl(): string | null {
    return this.tenantLogoUrl;
  }

  get shouldShowImage(): boolean {
    return !!this.tenantLogoUrl && !this.imageError;
  }

  onImageError(): void {
    this.imageError = true;
  }
}
