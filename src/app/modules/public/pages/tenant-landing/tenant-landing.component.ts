import { CommonModule } from '@angular/common';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BigsoAuth } from '@bigso/auth-sdk/browser';
import { environment } from '../../../../../environments/environment';
import { SdkService } from '../../../../core/services/sdk/sdk.service';
import { TenantService } from '../../../../core/services/tenant/tenant.service';
import { FooterComponent } from "../../components/footer";
import { HeaderComponent, HeaderCta } from "../../components/header/header.component";
import { MapComponent } from '../../components/map/map.component';

// New standardized interfaces matching API response
export interface TenantLocation {
  country: string | null;
  state: string | null;
  city: string | null;
  address: string | null;
  postalCode: string | null;
  formatted: string | null;
  coordinates: { lat: number; lng: number } | null;
}

export interface TenantBranding {
  primaryColor: string;
  logo: { url: string | null };
}

export interface TenantProfile {
  description: string;
  location: TenantLocation;
  hours: { display: string | null };
}

export interface ServiceItem {
  title: string;
  description: string;
  image: string;
  active?: boolean;
}

export interface TenantServices {
  active: boolean;
  data: ServiceItem[];
}

export interface TenantMedia {
  services?: TenantServices;
}

export interface TenantSocial {
  instagram: { url: string; username: string } | null;
}

export interface TenantContact {
  type: 'phone' | 'whatsapp' | 'email' | 'other';
  label: string;
  value: string;
}


export interface TenantLandingInfo {
  name: string;
  slug: string;
  branding: TenantBranding;
  profile: TenantProfile;
  media: TenantMedia;
  social: TenantSocial;
  contacts: TenantContact[];
}

@Component({
  selector: 'app-tenant-landing',
  standalone: true,
  imports: [CommonModule, MapComponent, FooterComponent, HeaderComponent],
  templateUrl: './tenant-landing.component.html',
  styleUrls: ['../../_tracker.scss']
})
export class TenantLandingComponent implements OnInit {
  // Header CTAs configuration
  headerCtas: HeaderCta[] = [
    { id: 'portal', type: 'button', variant: 'primary', label: 'Portal de Usuarios' },
    { id: 'login', type: 'button', variant: 'secondary', label: 'Acceder' }
  ];

  tenantSlug = '';
  tenant: TenantLandingInfo | null = null;
  loading = true;
  error = false;
  errorMessage: string = '';
  imageError = false;
  selectedImage: string | null = null;

  // Default accent color (brand-action fallback)
  defaultAccent = '#e05a20';

  // SSO Auth
  private auth: BigsoAuth | null = null;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient,
    private tenantService: TenantService,
    private sdkService: SdkService
  ) { }

  ngOnInit(): void {
    const slug = this.route.snapshot.paramMap.get('tenantSlug');

    if (!slug) {
      this.error = true;
      this.errorMessage = 'No se proporcionó un identificador de negocio';
      this.loading = false;
      return;
    }

    this.tenantSlug = slug;
    this.loadTenant();
  }

  private loadTenant(): void {
    this.http.get<any>(`${environment.middlewareBaseUrl}/api/tenants/public/${this.tenantSlug}`).subscribe({
      next: (data) => {
        if (data.success && data.data) {
          this.tenant = data.data;
          // Store tenant for quick access in /org popular searches
          const tenantToStore = {
            id: data.data.id || this.tenantSlug,
            name: data.data.name,
            slug: data.data.slug
          };
          this.tenantService.storeTenantInfo(tenantToStore);
        } else {
          this.error = true;
          this.errorMessage = `No se encontró un negocio con el identificador "${this.tenantSlug}"`;
        }
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = true;
        this.errorMessage = `No se encontró un negocio con el identificador "${this.tenantSlug}"`;
        this.loading = false;
      }
    });
  }

  onImageError(): void {
    this.imageError = true;
  }

  openImage(imageUrl: string): void {
    this.selectedImage = imageUrl;
  }

  closeImage(): void {
    this.selectedImage = null;
  }

  get initials(): string {
    const name = this.tenant?.name || this.tenantSlug;
    return name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('');
  }

  get accentColor(): string {
    return this.tenant?.branding?.primaryColor || this.defaultAccent;
  }

  get displayImageUrl(): string | null {
    return this.tenant?.branding?.logo?.url || null;
  }

  get shouldShowImage(): boolean {
    return !!this.displayImageUrl && !this.imageError;
  }

  get description(): string {
    return this.tenant?.profile?.description || 'Gestiona y consulta el estado de tus órdenes de servicio en tiempo real.';
  }

  get hours(): string {
    return this.tenant?.profile?.hours?.display || '';
  }

  get city(): string {
    return this.tenant?.profile?.location?.city || '';
  }

  get formattedLocation(): string {
    return this.tenant?.profile?.location?.formatted || '';
  }

  // Get contacts by type
  public getContactByType(type: 'phone' | 'whatsapp' | 'email'): TenantContact | undefined {
    return this.tenant?.contacts?.find(c => c.type === type);
  }

  get contactInfo(): { phone?: string; whatsapp?: string; email?: string } {
    return {
      phone: this.getContactByType('phone')?.value,
      whatsapp: this.getContactByType('whatsapp')?.value,
      email: this.getContactByType('email')?.value
    };
  }

  get whatsappLink(): string | null {
    const wa = this.contactInfo.whatsapp;
    return wa ? `https://wa.me/57${wa.replace(/\D/g, '')}` : null;
  }

  get phoneLink(): string | null {
    const phone = this.contactInfo.phone;
    return phone ? `tel:${phone.replace(/\s/g, '')}` : null;
  }

  get emailLink(): string | null {
    const email = this.contactInfo.email;
    return email ? `mailto:${email}` : null;
  }

  get instagramLink(): string | null {
    return this.tenant?.social?.instagram?.url || null;
  }

  get instagramHandle(): string {
    return this.tenant?.social?.instagram?.username || '';
  }

  onHeaderCta(ctaId: string): void {
    if (this.error) return;

    switch (ctaId) {
      case 'portal':
        this.goToConsult();
        break;
      case 'login':
        this.startLogin();
        break;
    }
  }

  goToConsult(): void {
    this.router.navigate(['/portal-usuarios', this.tenantSlug]);
  }

  goToAdmin(): void {
    // SSO login via BigsoAuth - redirects to auth/callback after login
    this.startLogin();
  }

  goBack(): void {
    // Navigate back to /org without clearing stored tenant
    // This preserves the recent tenant for quick access in popular searches
    this.router.navigate(['/org']);
  }

  get hasContactInfo(): boolean {
    const c = this.contactInfo;
    return !!(c.phone || c.whatsapp || c.email);
  }

  get hasInfoBarData(): boolean {
    return !!(this.hours || this.city || this.formattedLocation);
  }

  get coordinates(): { lat: number; lng: number } | null {
    return this.tenant?.profile?.location?.coordinates || null;
  }

  get hasCoordinates(): boolean {
    const coords = this.tenant?.profile?.location?.coordinates;
    return !!(coords?.lat && coords?.lng && coords.lat !== 0 && coords.lng !== 0);
  }

  get services(): ServiceItem[] {
    const servicesData = this.tenant?.media?.services?.data;
    if (!Array.isArray(servicesData)) return [];
    // Filter only active services
    return servicesData.filter(s => s.active === true);
  }

  get servicesSectionActive(): boolean {
    // Check if services section is enabled
    const servicesConfig = this.tenant?.media?.services;
    return servicesConfig?.active === true;
  }

  get hasActiveServices(): boolean {
    // Check if there are active services to display
    return this.services.length > 0;
  }

  // Services pagination
  showAllServices: boolean = false;

  get displayedServices(): ServiceItem[] {
    return this.showAllServices ? this.services : this.services.slice(0, 6);
  }

  toggleShowAllServices(): void {
    this.showAllServices = !this.showAllServices;
    // Smooth scroll to services section if closing
    if (!this.showAllServices) {
      const section = document.getElementById('services-section');
      if (section) {
        section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    }
  }


  // SSO Login with BigsoAuth
  async startLogin() {
    if (!this.tenant) {
      console.error('[Ordamy] No tenant data available');
      return;
    }
    const decodedTenantId = this.tenantService.decodeId(this.tenantSlug);
    this.sdkService.login(decodedTenantId);

  }
}
