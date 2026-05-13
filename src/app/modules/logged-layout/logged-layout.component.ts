import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterLink, RouterLinkActive, RouterOutlet } from '@angular/router';
import { Subject } from 'rxjs';
import { filter, takeUntil } from 'rxjs/operators';
import packageJson from '../../../../package.json';
import { environment } from '../../../environments/environment';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { SessionService } from '../../core/services/session/session.service';
import { Tenant, TenantSelectorComponent } from '../../shared/components/tenant-selector.component';

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
    private authService: SessionService,
    private router: Router,
    private appConfig: AppConfigService,
    private sessionService: SessionService,
  ) { }



  ngOnInit() {
    const userSession = this.sessionService.getUser();
    const currentTenant = this.sessionService.getCurrentTenant();
    const relatedTenants = this.sessionService.getRelatedTenants();

    if (userSession) {
      this.userName = `${userSession.firstName || ''} ${userSession.lastName || ''}`.trim() || userSession.userId;
    }

    if (currentTenant) {
      this.tenantName = currentTenant.name;
      // Pass currentTenant to the selector so it's auto-highlighted
      this.currentTenant = currentTenant;
    }

    if (relatedTenants?.length) {
      // Current tenant always first
      this.tenants = [
        ...relatedTenants.filter(t => t.id === currentTenant?.id),
        ...relatedTenants.filter(t => t.id !== currentTenant?.id),
      ];
    } else if (currentTenant) {
      this.tenants = [currentTenant];
    }


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
    this.sessionService.logout().subscribe({
      next: () => {
        this.sessionService.clearSession();
        this.router.navigate(['/']);
      },
      error: () => {
        // Should never reach here (logout() always completes), but just in case
        this.sessionService.clearSession();
        this.router.navigate(['/']);
      }
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
