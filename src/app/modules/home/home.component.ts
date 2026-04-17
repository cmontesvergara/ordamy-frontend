import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../core/services/auth/auth.service';

import { RouterModule } from '@angular/router';

@Component({
    selector: 'app-home',
    imports: [CommonModule, RouterModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
    tenantName = '';

    constructor(private authService: AuthService) { }

    ngOnInit() {
        this.authService.getSession().subscribe({
            next: (session: any) => {
                if (session && session.tenant) {
                    this.tenantName = session.tenant.name;
                }
            },
        });
    }
}
