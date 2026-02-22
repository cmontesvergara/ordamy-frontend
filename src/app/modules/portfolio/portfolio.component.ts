import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-portfolio',
    standalone: true,
    imports: [CommonModule],
    template: `<h1>Cartera</h1><p>Órdenes con saldo pendiente — próximamente</p>`,
})
export class PortfolioComponent { }
