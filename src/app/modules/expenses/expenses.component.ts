import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-expenses',
    standalone: true,
    imports: [CommonModule],
    template: `<h1>Egresos</h1><p>Listado de egresos — próximamente</p>`,
})
export class ExpensesComponent { }
