import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

export interface TenantLandingInfo {
  name: string;
  slug: string;
  color?: string;
  logoUrl?: string;
  instagramUrl?: string;
  settings?: {
    contact?: { name: string; value: string }[];
    description?: string;
    hours?: string;
    city?: string;
  };
}

@Component({
  selector: 'app-tenant-landing',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tenant-landing.component.html',
  styleUrls: ['../../_tracker.scss']
})
export class TenantLandingComponent implements OnInit {
  tenantSlug = '';
  tenant: TenantLandingInfo | null = null;
  loading = true;
  error = false;
  imageError = false;

  // Default accent color (brand-action fallback)
  defaultAccent = '#e05a20';

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private http: HttpClient
  ) {}

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') || '';
    this.loadTenant();
  }

  private loadTenant(): void {
    this.http.get<any>(`${environment.middlewareBaseUrl}/api/tenants/public/${this.tenantSlug}`).subscribe({
      next: (data) => {
        if (data.success && data.data) {
          this.tenant = {
            name: data.data.name,
            slug: data.data.slug,
            color: data.data.color || this.defaultAccent,
            logoUrl: data.data.logoUrl || data.data.imageUrl,
            instagramUrl: data.data.instagramUrl,
            settings: data.data.settings
          };
        } else {
          this.error = true;
        }
        this.loading = false;
      },
      error: (err: HttpErrorResponse) => {
        this.error = true;
        this.loading = false;
      }
    });
  }

  onImageError(): void {
    this.imageError = true;
  }

  get initials(): string {
    const name = this.tenant?.name || this.tenantSlug;
    return name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('');
  }

  get accentColor(): string {
    return this.tenant?.color || this.defaultAccent;
  }

  get displayImageUrl(): string | null {
    return this.tenant?.logoUrl || null;
  }

  get shouldShowImage(): boolean {
    return !!this.displayImageUrl && !this.imageError;
  }

  get description(): string {
    return this.tenant?.settings?.description || 'Gestiona y consulta el estado de tus órdenes de servicio en tiempo real.';
  }

  get hours(): string {
    return this.tenant?.settings?.hours || '';
  }

  get city(): string {
    return this.tenant?.settings?.city || '';
  }

  get contactInfo(): { phone?: string; whatsapp?: string; email?: string } {
    const contact: { phone?: string; whatsapp?: string; email?: string } = {};
    
    if (this.tenant?.settings?.contact) {
      this.tenant.settings.contact.forEach((c: { name: string; value: string }) => {
        const name = c.name.toLowerCase();
        if (name === 'teléfono' || name === 'telefono' || name === 'phone') {
          contact.phone = c.value;
        } else if (name === 'whatsapp' || name === 'whats app') {
          contact.whatsapp = c.value;
        } else if (name === 'email' || name === 'correo') {
          contact.email = c.value;
        }
      });
    }
    
    return contact;
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
    const ig = this.tenant?.instagramUrl;
    if (!ig) return null;
    // Handle both full URL and just username
    if (ig.startsWith('http')) return ig;
    return `https://instagram.com/${ig.replace('@', '')}`;
  }

  goToConsult(): void {
    this.router.navigate(['/org', this.tenantSlug, 'consultar']);
  }

  goToAdmin(): void {
    this.router.navigate(['/auth/org', this.tenantSlug]);
  }

  goBack(): void {
    this.router.navigate(['/org']);
  }

  get hasContactInfo(): boolean {
    const c = this.contactInfo;
    return !!(c.phone || c.whatsapp || c.email);
  }

  get hasInfoBarData(): boolean {
    return !!(this.hours || this.city);
  }
}
