import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../../../environments/environment';
import { PublicOrderService, PublicTenantInfo } from '../../../../core/services/public/public-order.service';
import { SdkService } from '../../../../core/services/sdk/sdk.service';
import { Tenant, TenantService } from '../../../../core/services/tenant/tenant.service';
import { HeaderComponent, HeaderCta } from '../../components/header/header.component';

type CredentialType = 'document' | 'phone' | 'order';
type ViewState = 'loading' | 'form' | 'validating' | 'no-results' | 'error';

interface OrderPreview {
  orderNumber: string;
  operationalStatus: string;
}

const OP_META: Record<string, { label: string; bgClass: string; textClass: string; explanation: string; action: string }> = {
  PENDING: {
    label: 'Recibida',
    bgClass: 'bg-slate-100',
    textClass: 'text-slate-700',
    explanation: 'Tu orden fue registrada exitosamente y esta en espera de que el equipo la revise y apruebe.',
    action: 'No necesitas hacer nada ahora. Espera la confirmacion.'
  },
  APPROVED: {
    label: 'Aprobada',
    bgClass: 'bg-blue-100',
    textClass: 'text-blue-700',
    explanation: 'Tu orden fue revisada y aprobada. Esta lista para iniciar produccion.',
    action: 'Si tienes saldo pendiente, este es el mejor momento para coordinarlo.'
  },
  IN_PRODUCTION: {
    label: 'En produccion',
    bgClass: 'bg-indigo-100',
    textClass: 'text-indigo-700',
    explanation: 'El equipo esta fabricando tu orden activamente en este momento.',
    action: 'No necesitas hacer nada. Pronto recibiras aviso cuando este lista.'
  },
  PRODUCED: {
    label: 'Lista para entrega',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
    explanation: 'Tu orden esta terminada! Solo falta coordinar la entrega o el recogido.',
    action: 'Comunicate para coordinar cuando y como recibes tu orden.'
  },
  DELIVERED: {
    label: 'Entregada',
    bgClass: 'bg-emerald-100',
    textClass: 'text-emerald-700',
    explanation: 'Tu orden fue entregada exitosamente. Esperamos que estes muy satisfecho.',
    action: 'Gracias por tu confianza! Esperamos verte pronto de nuevo.'
  },
  CANCELLED: {
    label: 'Anulada',
    bgClass: 'bg-rose-100',
    textClass: 'text-rose-700',
    explanation: 'Esta orden fue anulada y ya no esta activa.',
    action: 'Comunicate con el negocio si tienes dudas sobre la anulacion.'
  }
};

@Component({
  selector: 'app-portal-usuarios-tenant',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent],
  templateUrl: './portal-usuarios-tenant.component.html',
  styleUrls: ['./portal-usuarios.component.scss']
})
export class PortalUsuariosTenantComponent implements OnInit {
  headerCtas: HeaderCta[] = [
    { id: 'business-label', type: 'label', label: 'Eres un negocio?' },
    { id: 'create-account', type: 'button', variant: 'primary', label: 'Crear cuenta' }
  ];

  tenant: Tenant | null = null;
  tenantInfo: PublicTenantInfo | null = null;
  tenantLogoUrl: string | null = null;
  tenantSlug = '';
  customerName = '';

  viewState: ViewState = 'loading';

  previewOrder: OrderPreview | null = null;
  showPreviewModal = false;

  apiError = '';
  imageError = false;

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

          this.tenantInfo = {
            name: tenant.name,
            slug: tenant.slug,
            phone: null,
            email: null,
            whatsapp: null
          };

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
      const orderId = this.credentialValue.trim().replace(/^ORD-/i, '');

      this.publicOrderService.getOrderPreview(this.tenantSlug, orderId)
        .subscribe({
          next: (res) => {
            if (res.success && res.preview) {
              this.previewOrder = res.preview;
              this.showPreviewModal = true;
            } else {
              this.viewState = 'no-results';
            }
          },
          error: () => {
            this.viewState = 'no-results';
          }
        });
      return;
    }

    this.viewState = 'validating';

    const phone = this.credentialType === 'phone' ? this.credentialValue.trim() : '';
    const document = this.credentialType === 'document' ? this.credentialValue.trim() : '';

    this.publicOrderService.getCustomerOrders(this.tenantSlug, phone, document).subscribe({
      next: (res) => {
        if (res.success && res.orders && res.orders.length > 0) {
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

  closePreviewModal(): void {
    this.showPreviewModal = false;
    this.previewOrder = null;
  }

  goToFullDetail(): void {
    this.router.navigate(['portal-usuarios', this.tenantSlug, 'ordenes', this.credentialValue.trim()]);
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

  getOperationalMeta(status: string): { label: string; bgClass: string; textClass: string; explanation: string; action: string } {
    return OP_META[status] || OP_META['PENDING'];
  }
}