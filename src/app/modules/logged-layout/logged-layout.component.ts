import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../core/services/auth/auth.service';
import { ThemeService } from '../../core/services/theme/theme.service';

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
  template: `
    <div class="layout" [class.sidebar-collapsed]="sidebarCollapsed">
      <!-- Sidebar -->
      <aside class="sidebar">
        <div class="sidebar-header">
          <div class="logo">
            <img *ngIf="sidebarCollapsed" src="assets/ordamy_icon_512.png" alt="Ordamy Icon" class="logo-icon-img" />
            <img *ngIf="!sidebarCollapsed" [src]="themeService.isDark ? 'assets/ordamy_logo_invert.png' : 'assets/ordamy_logo.png'" alt="Ordamy Logo" class="logo-full-img" />
          </div>
          <button class="collapse-btn" (click)="sidebarCollapsed = !sidebarCollapsed">
            {{ sidebarCollapsed ? '→' : '←' }}
          </button>
        </div>

        <nav class="sidebar-nav">
          @for (item of menuItems; track item.route) {
            <a
              [routerLink]="item.route"
              routerLinkActive="active"
              class="nav-item"
              [title]="item.label"
            >
              <span class="nav-icon">{{ item.icon }}</span>
              <span class="nav-label" *ngIf="!sidebarCollapsed">{{ item.label }}</span>
            </a>
          }
        </nav>

        <div class="sidebar-footer">
          <button class="nav-item" (click)="toggleTheme()" [title]="themeService.isDark ? 'Modo claro' : 'Modo oscuro'">
            <span class="nav-icon">{{ themeService.isDark ? '☀️' : '🌙' }}</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed">
              {{ themeService.isDark ? 'Claro' : 'Oscuro' }}
            </span>
          </button>
          <button class="nav-item logout" (click)="logout()" title="Cerrar sesión">
            <span class="nav-icon">🚪</span>
            <span class="nav-label" *ngIf="!sidebarCollapsed">Salir</span>
          </button>
        </div>
      </aside>

      <!-- Main Content -->
      <main class="main-content">
        <!-- Top Navbar -->
        <header class="navbar">
          <div class="navbar-left">
            <h2 class="page-title">{{ currentPageTitle }}</h2>
          </div>
          <div class="navbar-right">
            <span class="user-info" *ngIf="userName">
              👤 {{ userName }}
            </span>
            <span class="tenant-badge" *ngIf="tenantName">
              {{ tenantName }}
            </span>
          </div>
        </header>

        <!-- Page Content -->
        <div class="page-content">
          <router-outlet></router-outlet>
        </div>
      </main>

      <!-- Mobile Bottom Nav -->
      <nav class="bottom-nav">
        @for (item of menuItems | slice:0:5; track item.route) {
          <a
            [routerLink]="item.route"
            routerLinkActive="active"
            class="bottom-nav-item"
          >
            <span>{{ item.icon }}</span>
            <small>{{ item.label }}</small>
          </a>
        }
      </nav>
    </div>
  `,
  styleUrl: './logged-layout.component.scss',
})
export class LoggedLayoutComponent implements OnInit {
  sidebarCollapsed = false;
  userName = '';
  tenantName = '';
  currentPageTitle = 'Dashboard';

  menuItems: MenuItem[] = [
    { label: 'Dashboard', icon: '📊', route: '/dashboard' },
    { label: 'Órdenes', icon: '📋', route: '/orders' },
    { label: 'Clientes', icon: '👥', route: '/customers' },
    { label: 'Egresos', icon: '💸', route: '/expenses' },
    { label: 'Caja', icon: '🏦', route: '/cashier' },
    { label: 'Cartera', icon: '💰', route: '/portfolio' },
    { label: 'Reportes', icon: '📈', route: '/reports' },
    { label: 'Configuración', icon: '⚙️', route: '/settings' },
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
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
  }

  toggleTheme() {
    this.themeService.toggleMode();
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
