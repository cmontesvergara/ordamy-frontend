import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: '',
    loadComponent: () =>
      import('./pages/org-home/org-home.component').then(m => m.OrgHomeComponent),
  },
  {
    path: ':tenantSlug',
    loadComponent: () =>
      import('./pages/tenant-landing/tenant-landing.component').then(m => m.TenantLandingComponent),
  },
  {
    path: ':tenantSlug/consultar',
    loadComponent: () =>
      import('./pages/customer-validate/customer-validate.component').then(m => m.CustomerValidateComponent),
  },
  {
    path: ':tenantSlug/ordenes',
    loadComponent: () =>
      import('./pages/order-list/order-list.component').then(m => m.OrderListComponent),
  },
  {
    path: ':tenantSlug/ordenes/:orderId',
    loadComponent: () =>
      import('./pages/order-status/order-status.component').then(m => m.OrderStatusComponent),
  },
];
