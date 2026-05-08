import { Routes } from '@angular/router';
import { CallbackComponent } from './pages/callback/callback.component';
import { OrgRedirectComponent } from './pages/org/org-redirect.component';

export const AUTH_ROUTES: Routes = [
    { path: 'callback', component: CallbackComponent },
    { path: 'org/:slug', component: OrgRedirectComponent },
];
