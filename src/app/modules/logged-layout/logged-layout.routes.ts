import { Routes } from '@angular/router';
import { LoggedLayoutComponent } from './logged-layout.component';
import { hasPermissionGuard } from '../../core/guards/has-permission/has-permission.guard';

export const LOGGED_ROUTES: Routes = [
    {
        path: '',
        component: LoggedLayoutComponent,
        children: [
            { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
            {
                path: 'dashboard',
                loadComponent: () =>
                    import('../dashboard/dashboard.component').then((m) => m.DashboardComponent),
            },
            {
                path: 'orders',
                loadComponent: () =>
                    import('../orders/orders.component').then((m) => m.OrdersComponent),
                canActivate: [hasPermissionGuard('orders', 'read')],
            },
            {
                path: 'orders/new',
                loadComponent: () =>
                    import('../orders/order-create/order-create.component').then((m) => m.OrderCreateComponent),
                canActivate: [hasPermissionGuard('orders', 'create')],
            },
            {
                path: 'orders/:id',
                loadComponent: () =>
                    import('../orders/order-detail/order-detail.component').then((m) => m.OrderDetailComponent),
                canActivate: [hasPermissionGuard('orders', 'read')],
            },
            {
                path: 'customers',
                loadComponent: () =>
                    import('../customers/customers.component').then((m) => m.CustomersComponent),
                canActivate: [hasPermissionGuard('customers', 'read')],
            },
            {
                path: 'expenses',
                loadComponent: () =>
                    import('../expenses/expenses.component').then((m) => m.ExpensesComponent),
                canActivate: [hasPermissionGuard('expenses', 'read')],
            },
            {
                path: 'cashier',
                loadComponent: () =>
                    import('../cashier/cashier.component').then((m) => m.CashierComponent),
                canActivate: [hasPermissionGuard('cashier', 'read')],
            },
            {
                path: 'portfolio',
                loadComponent: () =>
                    import('../portfolio/portfolio.component').then((m) => m.PortfolioComponent),
                canActivate: [hasPermissionGuard('portfolio', 'read')],
            },
            {
                path: 'reports',
                loadComponent: () =>
                    import('../reports/reports.component').then((m) => m.ReportsComponent),
                canActivate: [hasPermissionGuard('reports', 'read')],
            },
            {
                path: 'settings',
                loadComponent: () =>
                    import('../settings/settings.component').then((m) => m.SettingsComponent),
                canActivate: [hasPermissionGuard('settings', 'read')],
            },
        ],
    },
];
