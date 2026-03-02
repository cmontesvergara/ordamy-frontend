import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive, NavigationEnd } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { environment } from '../../../environments/environment';
import { filter } from 'rxjs/operators';

interface MenuItem {
  label: string;
  icon: string;
  route: string;
  permission?: { resource: string; action: string };
}

@Component({
  selector: 'app-logged-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  templateUrl: './logged-layout.component.html',
})
export class LoggedLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  userName = '';
  tenantName = '';
  currentPageTitle = 'Estadísticas';
  ssoUrl = environment.ssoUrl;

  menuItems: MenuItem[] = [
    { label: 'Estadísticas', icon: 'dashboard', route: '/dashboard' },
    { label: 'Órdenes', icon: 'orders', route: '/orders' },
    { label: 'Clientes', icon: 'customers', route: '/customers' },
    { label: 'Egresos', icon: 'expenses', route: '/expenses' },
    { label: 'Caja', icon: 'cashier', route: '/cashier' },
    { label: 'Cartera', icon: 'portfolio', route: '/portfolio' },
    { label: 'Reportes', icon: 'reports', route: '/reports' },
    { label: 'Configuración', icon: 'settings', route: '/settings' },
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
    const match = this.menuItems.find(m => url === m.route || url.startsWith(m.route + '/'));
    this.currentPageTitle = match?.label || 'Estadísticas';
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        window.location.href = '/';
      },
      error: () => {
        window.location.href = '/';
      },
    });
  }
}
