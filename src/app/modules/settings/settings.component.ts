import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings/settings.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header"><h1>Configuración</h1></div>

    <div class="tabs">
      <button class="tab" [class.active]="activeTab === 'payment'" (click)="activeTab = 'payment'">Medios de Pago</button>
      <button class="tab" [class.active]="activeTab === 'categories'" (click)="activeTab = 'categories'">Categorías</button>
      <button class="tab" [class.active]="activeTab === 'suppliers'" (click)="activeTab = 'suppliers'">Proveedores</button>
      <button class="tab" [class.active]="activeTab === 'tax'" (click)="activeTab = 'tax'">Impuestos</button>
      <button class="tab" [class.active]="activeTab === 'financial'" (click)="activeTab = 'financial'">Financiero</button>
    </div>

    <!-- Payment Methods -->
    <div *ngIf="activeTab === 'payment'">
      <div class="inline-form">
        <input [(ngModel)]="newPaymentMethod" placeholder="Nuevo medio de pago" />
        <button class="btn btn-primary btn-sm" (click)="addPaymentMethod()" [disabled]="!newPaymentMethod">Agregar</button>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Estado</th></tr></thead>
          <tbody>
            @for (m of paymentMethods; track m.id) {
              <tr>
                <td><strong>{{ m.name }}</strong></td>
                <td><span class="badge" [class.active]="m.isActive">{{ m.isActive ? 'Activo' : 'Inactivo' }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Categories -->
    <div *ngIf="activeTab === 'categories'">
      <div class="inline-form">
        <input [(ngModel)]="newCategory.name" placeholder="Nombre de categoría" />
        <select [(ngModel)]="newCategory.type">
          <option value="EXPENSE">Egreso</option>
          <option value="BOTH">Ambos</option>
        </select>
        <button class="btn btn-primary btn-sm" (click)="addCategory()" [disabled]="!newCategory.name">Agregar</button>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Tipo</th></tr></thead>
          <tbody>
            @for (c of categories; track c.id) {
              <tr>
                <td><strong>{{ c.name }}</strong></td>
                <td><span class="badge">{{ c.type }}</span></td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Suppliers -->
    <div *ngIf="activeTab === 'suppliers'">
      <div class="inline-form">
        <input [(ngModel)]="newSupplier.name" placeholder="Nombre" />
        <input [(ngModel)]="newSupplier.phone" placeholder="Teléfono" />
        <button class="btn btn-primary btn-sm" (click)="addSupplier()" [disabled]="!newSupplier.name">Agregar</button>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Teléfono</th><th>Contacto</th></tr></thead>
          <tbody>
            @for (s of suppliers; track s.id) {
              <tr>
                <td><strong>{{ s.name }}</strong></td>
                <td>{{ s.phone || '—' }}</td>
                <td>{{ s.contactName || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Tax -->
    <div *ngIf="activeTab === 'tax'">
      <div class="inline-form">
        <input [(ngModel)]="newTax.name" placeholder="Nombre (ej: IVA 19%)" />
        <input type="number" [(ngModel)]="newTax.rate" placeholder="Tasa (0.19)" step="0.01" />
        <button class="btn btn-primary btn-sm" (click)="addTax()" [disabled]="!newTax.name">Agregar</button>
      </div>
      <div class="card">
        <table class="data-table">
          <thead><tr><th>Nombre</th><th>Tasa</th><th>Default</th></tr></thead>
          <tbody>
            @for (t of taxConfigs; track t.id) {
              <tr>
                <td><strong>{{ t.name }}</strong></td>
                <td>{{ t.rate * 100 }}%</td>
                <td>{{ t.isDefault ? '✅' : '' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <!-- Financial -->
    <div *ngIf="activeTab === 'financial'">
      <div class="card form-card" *ngIf="financialConfig">
        <div class="form-grid">
          <div class="form-group">
            <label>Moneda</label>
            <input [(ngModel)]="financialConfig.currency" />
          </div>
          <div class="form-group">
            <label>Zona horaria</label>
            <input [(ngModel)]="financialConfig.timezone" />
          </div>
          <div class="form-group">
            <label>Días de gracia</label>
            <input type="number" [(ngModel)]="financialConfig.graceDays" />
          </div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary" (click)="saveFinancial()">Guardar</button>
        </div>
      </div>
    </div>
  `,
    styleUrl: './settings.component.scss',
})
export class SettingsComponent implements OnInit {
    activeTab = 'payment';
    paymentMethods: any[] = [];
    categories: any[] = [];
    suppliers: any[] = [];
    taxConfigs: any[] = [];
    financialConfig: any = null;

    newPaymentMethod = '';
    newCategory = { name: '', type: 'EXPENSE' };
    newSupplier = { name: '', phone: '' };
    newTax = { name: '', rate: 0 };

    constructor(private settingsService: SettingsService) { }

    ngOnInit() {
        this.loadAll();
    }

    loadAll() {
        this.settingsService.getPaymentMethods().subscribe({ next: (res: any) => { this.paymentMethods = res.data; } });
        this.settingsService.getCategories().subscribe({ next: (res: any) => { this.categories = res.data; } });
        this.settingsService.getSuppliers().subscribe({ next: (res: any) => { this.suppliers = res.data; } });
        this.settingsService.getTaxConfigs().subscribe({ next: (res: any) => { this.taxConfigs = res.data; } });
        this.settingsService.getFinancialConfig().subscribe({ next: (res: any) => { this.financialConfig = res.data; } });
    }

    addPaymentMethod() {
        this.settingsService.createPaymentMethod({ name: this.newPaymentMethod }).subscribe({
            next: () => { this.newPaymentMethod = ''; this.loadAll(); },
        });
    }

    addCategory() {
        this.settingsService.createCategory(this.newCategory).subscribe({
            next: () => { this.newCategory = { name: '', type: 'EXPENSE' }; this.loadAll(); },
        });
    }

    addSupplier() {
        this.settingsService.createSupplier(this.newSupplier).subscribe({
            next: () => { this.newSupplier = { name: '', phone: '' }; this.loadAll(); },
        });
    }

    addTax() {
        this.settingsService.createTaxConfig(this.newTax).subscribe({
            next: () => { this.newTax = { name: '', rate: 0 }; this.loadAll(); },
        });
    }

    saveFinancial() {
        this.settingsService.updateFinancialConfig(this.financialConfig).subscribe({
            next: () => { alert('Configuración guardada'); },
        });
    }
}
