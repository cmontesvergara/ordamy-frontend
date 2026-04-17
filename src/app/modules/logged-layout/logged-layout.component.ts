import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil, filter } from 'rxjs/operators';
import { AuthService } from '../../core/services/auth/auth.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { environment } from '../../../environments/environment';
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
    imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, TenantSelectorComponent],
    templateUrl: './logged-layout.component.html'
})
export class LoggedLayoutComponent implements OnInit, OnDestroy {
  sidebarCollapsed = false;
  leftMenuOpen = false;
  rightMenuOpen = false;
  private touchStartX = 0;
  private touchEndX = 0;
  private destroy$ = new Subject<void>();

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
    // Usar getSessionWithAutoRefresh para manejar refreshRequired automáticamente
    this.authService.getSessionWithAutoRefresh().pipe(
      takeUntil(this.destroy$)
    ).subscribe({
      next: (session: any) => {
        if (session?.user) {
          this.userName = `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.userId;
        }
        if (session?.tenant) {
          this.tenantName = session.tenant.name;
        }
        // Load tenants from response (backend now sends tenants array directly)
        if (session?.tenants) {
          this.tenants = session.tenants;
          // Set current tenant (first one or the one matching tenantId)
          this.currentTenant = this.tenants.find((t: Tenant) => t.id === session.tenant?.tenantId) || this.tenants[0] || null;
        }
      },
      error: (err) => {
        console.error('Failed to get session:', err);
        // Si hay error 401/403, redirigir a login
        if (err.status === 401 || err.status === 403) {
          this.router.navigate(['/auth/login']);
        }
      }
    });
    this.appConfig.load();

    // Update page title on navigation
    this.updatePageTitle(this.router.url);
    this.router.events.pipe(
      filter((e): e is NavigationEnd => e instanceof NavigationEnd),
      takeUntil(this.destroy$)
    ).subscribe(e => this.updatePageTitle(e.urlAfterRedirects || e.url));
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
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
