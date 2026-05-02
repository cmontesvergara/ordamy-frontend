import { Component, OnInit } from '@angular/core';


import { RouterModule } from '@angular/router';
import { SessionService } from '../../core/services/session/session.service';

@Component({
    selector: 'app-home',
    imports: [RouterModule],
    templateUrl: './home.component.html',
    styleUrl: './home.component.scss'
})
export class HomeComponent implements OnInit {
    tenantName = '';

    constructor(private sessionService: SessionService) { }

    ngOnInit() {
        this.tenantName = this.sessionService.getCurrentTenant().name
    }
}
