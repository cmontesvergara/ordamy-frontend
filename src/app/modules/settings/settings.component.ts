import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule],
    template: `<h1>Configuración</h1><p>Medios de pago, categorías, proveedores — próximamente</p>`,
})
export class SettingsComponent { }
