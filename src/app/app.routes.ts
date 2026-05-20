import { Routes } from '@angular/router';
import { isLoggedGuard } from './core/guards/is-logged/is-logged.guard';
import { ValidTenantGuard } from './core/guards/valid-tenant.guard';

export const routes: Routes = [
    {
        path: '',
        loadChildren: () =>
            import('./modules/home/home.routes').then((m) => m.HOME_ROUTES),
    },
    {
        path: 'auth',
        loadChildren: () =>
            import('./modules/auth/auth.routes').then((m) => m.AUTH_ROUTES),
    },
    {
        path: '',
        canActivate: [isLoggedGuard],
        loadChildren: () =>
            import('./modules/logged-layout/logged-layout.routes').then(
                (m) => m.LOGGED_ROUTES,
            ),
    },
    {
        path: 'org',
        loadChildren: () =>
            import('./modules/public/public.routes').then((m) => m.PUBLIC_ROUTES),
    },
    {
        path: 'portal-usuarios',
        loadComponent: () =>
            import('./modules/public/pages/portal-usuarios/portal-usuarios.component').then(m => m.PortalUsuariosComponent),
    },
    {
        path: 'portal-usuarios/:tenantSlug',
        canActivate: [ValidTenantGuard],
        loadComponent: () =>
            import('./modules/public/pages/portal-usuarios/portal-usuarios-tenant.component').then(m => m.PortalUsuariosTenantComponent),
    },
    {
        path: 'portal-usuarios/:tenantSlug/dashboard',
        canActivate: [ValidTenantGuard],
        loadComponent: () =>
            import('./modules/public/pages/customer-dashboard/customer-dashboard.component').then(m => m.CustomerDashboardComponent),
    },
    {
        path: 'portal-usuarios/:tenantSlug/ordenes',
        canActivate: [ValidTenantGuard],
        loadComponent: () =>
            import('./modules/public/pages/order-list/order-list.component').then(m => m.OrderListComponent),
    },
    {
        path: 'portal-usuarios/:tenantSlug/ordenes/:orderId',
        canActivate: [ValidTenantGuard],
        loadComponent: () =>
            import('./modules/public/pages/order-status/order-status.component').then(m => m.OrderStatusComponent),
    },
    
    { path: '**', redirectTo: 'dashboard' },
];
