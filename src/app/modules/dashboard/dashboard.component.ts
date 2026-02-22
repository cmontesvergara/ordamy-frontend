import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
    selector: 'app-dashboard',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="dashboard">
      <h1>Dashboard</h1>
      <p>Resumen financiero — próximamente</p>
    </div>
  `,
})
export class DashboardComponent { }
