import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { environment } from '../../../environments/environment';
import { filter } from 'rxjs/operators';
import packageJson from '../../../../package.json';
import { TenantSelectorComponent, Tenant } from '../../shared/components/tenant-selector.component';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  permission?: { resource: string; action: string };
}

@Component({
  selector: 'app-logged-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TenantSelectorComponent],
  templateUrl: './logged-layout.component.html',
})
export class LoggedLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  leftMenuOpen = false;
  rightMenuOpen = false;
  private touchStartX = 0;
  private touchEndX = 0;

  userName = '';
  tenantName = '';
  currentPageTitle = 'Inicio';
  ssoPortalUrl = environment.ssoPortalUrl;
  appVersion = packageJson.version;

  // Multi-tenant selector
  tenants: Tenant[] = [];
  currentTenant: Tenant | null = null;

  menuItems: MenuItem[] = [
    { label: 'Estadísticas', icon: 'dashboard', route: '/dashboard' },
    { label: 'Órdenes', icon: 'orders', route: '/orders' },
    { label: 'Clientes', icon: 'customers', route: '/customers' },
    { label: 'Egresos', icon: 'expenses', route: '/expenses' },
    { label: 'Caja', icon: 'cashier', route: '/cashier' },
    { label: 'Cartera', icon: 'portfolio', route: '/portfolio' },
    { label: 'Reportes', icon: 'reports', route: '/reports' },
    { label: 'Productos', icon: 'products', route: '/products' },
    { label: 'Materiales', icon: 'products', route: '/materials' },
    { label: 'Configuración', icon: 'settings', route: '/settings' },
    { label: 'Soporte', icon: 'support', route: '/support' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    private appConfig: AppConfigService,
  ) { }

  ngOnInit() {
    this.authService.getSession().subscribe({
      next: (session: any) => {
        if (session?.user) {
          this.userName = `${session.user.firstName} ${session.user.lastName}`;
        }
        if (session?.tenant) {
          this.tenantName = session.tenant.name;
        }
        // Load tenants from token payload
        if (session?.tokenPayload?.tenants) {
          this.tenants = session.tokenPayload.tenants;
          // Set current tenant (first one or the one matching tenantId)
          this.currentTenant = this.tenants[0] || null;
        }
      },
    });
    this.appConfig.load();

    // Update page title on navigation
    this.updatePageTitle(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd)
    ).subscribe(e => this.updatePageTitle(e.urlAfterRedirects || e.url));
  }

  private updatePageTitle(url: string) {
    if (url === '/home' || url === '/') {
      this.currentPageTitle = 'Inicio';
      return;
    }
    const match = this.menuItems.find(m => url === m.route || url.startsWith(m.route + '/'));
    this.currentPageTitle = match?.label || 'Ordamy';
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.authService.handleLogout();
        window.location.href = '/';
      },
      error: () => {
        this.authService.handleLogout();
        window.location.href = '/';
      },
    });
  }

  onTouchStart(e: TouchEvent) {
    this.touchStartX = e.changedTouches[0].screenX;
  }

  onTouchEnd(e: TouchEvent) {
    this.touchEndX = e.changedTouches[0].screenX;
    this.handleSwipe();
  }

  private handleSwipe() {
    const swipeDistance = this.touchEndX - this.touchStartX;
    const threshold = 50;

    // Swipe Left
    if (swipeDistance < -threshold) {
      if (this.leftMenuOpen) {
        this.leftMenuOpen = false;
      } else if (!this.rightMenuOpen) {
        if (this.touchStartX > window.innerWidth - 50) {
          this.rightMenuOpen = true;
        }
      }
    }

    // Swipe Right
    if (swipeDistance > threshold) {
      if (this.rightMenuOpen) {
        this.rightMenuOpen = false;
      } else if (!this.leftMenuOpen) {
        if (this.touchStartX < 50) {
          this.leftMenuOpen = true;
        }
      }
    }
  }

  closeMenus() {
    this.leftMenuOpen = false;
    this.rightMenuOpen = false;
  }

  // Handler for tenant selection from TenantSelectorComponent
  onTenantSelected(tenant: Tenant) {
    this.currentTenant = tenant;
    // TODO: Implement actual tenant switch logic (reload session or redirect to SSO)
    console.log('Selected tenant:', tenant);
    // Option 1: Reload page to get new session with updated tenant
    // window.location.reload();
    // Option 2: Call service to switch tenant and reload session
    // this.authService.switchTenant(tenant.id).subscribe(() => window.location.reload());
  }
}
