import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule],
    template: `<h1>Clientes</h1><p>Listado de clientes — próximamente</p>`,
})
export class CustomersComponent { }
