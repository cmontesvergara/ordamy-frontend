import { Injectable } from '@angular/core';
import { AuthService } from '../auth/auth.service';

@Injectable({
    providedIn: 'root',
})
export class SessionService {

    constructor(private authService: AuthService) {

    }

    fromApi() {

        // return this.authService.getSession().subscribe({
        //     next: (session: any) => {
        //         if (session && session.tenant) {
        //             this.tenantName = session.tenant.name;
        //         }
        //     },
        // });
    }



}
