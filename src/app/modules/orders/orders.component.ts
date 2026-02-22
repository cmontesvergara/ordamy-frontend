import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-orders',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="orders">
      <h1>Órdenes</h1>
      <p>Listado de órdenes — próximamente</p>
    </div>
  `,
})
export class OrdersComponent { }
