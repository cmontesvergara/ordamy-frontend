import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-cashier',
    standalone: true,
    imports: [CommonModule],
    template: `<h1>Caja</h1><p>Operaciones de caja — próximamente</p>`,
})
export class CashierComponent { }
