import { Routes } from '@angular/router';
import { ValidTenantGuard } from '../../core/guards/valid-tenant.guard';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/org-home/org-home.component').then(m => m.OrgHomeComponent),
  },
  {
    path: 'portal-usuarios',
    loadComponent: () =>
      import('./pages/portal-usuarios/portal-usuarios.component').then(m => m.PortalUsuariosComponent),
  },
  {
    path: 'portal-usuarios/:tenantSlug',
    canActivate: [ValidTenantGuard],
    loadComponent: () =>
      import('./pages/portal-usuarios/portal-usuarios-tenant.component').then(m => m.PortalUsuariosTenantComponent),
  },
  {
    path: 'portal-usuarios/:tenantSlug/dashboard',
    canActivate: [ValidTenantGuard],
    loadComponent: () =>
      import('./pages/customer-dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent),
  },
  {
    path: 'portal-usuarios/:tenantSlug/ordenes/:orderId',
    canActivate: [ValidTenantGuard],
    loadComponent: () =>
      import('./pages/order-status/order-status.component').then(m => m.OrderStatusComponent),
  },
  {
    path: ':tenantSlug',
    loadComponent: () =>
      import('./pages/tenant-landing/tenant-landing.component').then(m => m.TenantLandingComponent),
  },
];
