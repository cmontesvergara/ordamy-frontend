import { Routes } from '@angular/router';
import { WelcomeComponent } from './pages/welcome/welcome.component';

export const HOME_ROUTES: Routes = [
    {
        path: '',
        children: [
            { path: '', redirectTo: 'welcome', pathMatch: 'full' },
            { path: 'welcome', component: WelcomeComponent },
        ],
    },
];
