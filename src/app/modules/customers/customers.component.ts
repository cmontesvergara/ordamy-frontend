import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CustomerService } from '../../core/services/customer/customer.service';

@Component({
    selector: 'app-customers',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header">
      <h1>Clientes</h1>
      <button class="btn btn-primary" (click)="showForm = !showForm">
        {{ showForm ? 'Cancelar' : '+ Nuevo Cliente' }}
      </button>
    </div>

    <!-- Create Form -->
    <div class="card form-card" *ngIf="showForm">
      <h3>Nuevo Cliente</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Identificación *</label>
          <input [(ngModel)]="newCustomer.identification" placeholder="NIT / CC" />
        </div>
        <div class="form-group">
          <label>Nombre *</label>
          <input [(ngModel)]="newCustomer.name" placeholder="Nombre completo" />
        </div>
        <div class="form-group">
          <label>Teléfono</label>
          <input [(ngModel)]="newCustomer.phone" placeholder="Teléfono" />
        </div>
        <div class="form-group">
          <label>Email</label>
          <input [(ngModel)]="newCustomer.email" placeholder="Email" />
        </div>
        <div class="form-group full-width">
          <label>Dirección</label>
          <input [(ngModel)]="newCustomer.address" placeholder="Dirección" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" (click)="createCustomer()" [disabled]="saving">
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <!-- Search -->
    <div class="search-bar">
      <input
        type="text"
        [(ngModel)]="searchTerm"
        (input)="onSearch()"
        placeholder="🔍 Buscar por nombre o NIT..."
        class="search-input"
      />
    </div>

    <!-- Table -->
    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>Identificación</th>
            <th>Nombre</th>
            <th>Teléfono</th>
            <th>Email</th>
            <th>Estado</th>
          </tr>
        </thead>
        <tbody>
          @for (c of customers; track c.id) {
            <tr>
              <td class="mono">{{ c.identification }}</td>
              <td><strong>{{ c.name }}</strong></td>
              <td>{{ c.phone || '—' }}</td>
              <td>{{ c.email || '—' }}</td>
              <td>
                <span class="badge" [class.active]="c.isActive" [class.inactive]="!c.isActive">
                  {{ c.isActive ? 'Activo' : 'Inactivo' }}
                </span>
              </td>
            </tr>
          }
          @if (customers.length === 0 && !loading) {
            <tr><td colspan="5" class="empty">No se encontraron clientes</td></tr>
          }
        </tbody>
      </table>

      <!-- Pagination -->
      <div class="pagination" *ngIf="total > limit">
        <button class="btn btn-sm" [disabled]="page <= 1" (click)="changePage(page - 1)">← Anterior</button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button class="btn btn-sm" [disabled]="page >= totalPages" (click)="changePage(page + 1)">Siguiente →</button>
      </div>
    </div>
  `,
    styleUrl: './customers.component.scss',
})
export class CustomersComponent implements OnInit {
    customers: any[] = [];
    total = 0;
    page = 1;
    limit = 20;
    searchTerm = '';
    loading = true;
    showForm = false;
    saving = false;
    searchTimeout: any;

    newCustomer = { identification: '', name: '', phone: '', email: '', address: '' };

    get totalPages() { return Math.ceil(this.total / this.limit); }

    constructor(private customerService: CustomerService) { }

    ngOnInit() { this.loadCustomers(); }

    loadCustomers() {
        this.loading = true;
        this.customerService.list({ page: this.page, limit: this.limit, search: this.searchTerm }).subscribe({
            next: (res: any) => {
                this.customers = res.data;
                this.total = res.total;
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }

    onSearch() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.page = 1;
            this.loadCustomers();
        }, 400);
    }

    changePage(p: number) {
        this.page = p;
        this.loadCustomers();
    }

    createCustomer() {
        if (!this.newCustomer.identification || !this.newCustomer.name) return;
        this.saving = true;
        this.customerService.create(this.newCustomer).subscribe({
            next: () => {
                this.saving = false;
                this.showForm = false;
                this.newCustomer = { identification: '', name: '', phone: '', email: '', address: '' };
                this.loadCustomers();
            },
            error: () => { this.saving = false; },
        });
    }
}
