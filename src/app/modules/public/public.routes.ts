import { Routes } from '@angular/router';

export const PUBLIC_ROUTES: Routes = [
  {
    path: ':tenantSlug',
    children: [
      {
        path: '',
        loadComponent: () =>
          import('./pages/customer-validate/customer-validate.component').then(m => m.CustomerValidateComponent),
      },
      {
        path: 'pedidos',
        loadComponent: () =>
          import('./pages/order-list/order-list.component').then(m => m.OrderListComponent),
      },
      {
        path: 'pedidos/:orderId',
        loadComponent: () =>
          import('./pages/order-status/order-status.component').then(m => m.OrderStatusComponent),
      },
    ]
  }
];
