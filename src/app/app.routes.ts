import { Routes } from '@angular/router';
import { isLoggedGuard } from './core/guards/is-logged/is-logged.guard';

export const routes: Routes = [
    {
        path: '',
        redirectTo: 'dashboard',
        pathMatch: 'full',
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
    { path: '**', redirectTo: 'dashboard' },
];
