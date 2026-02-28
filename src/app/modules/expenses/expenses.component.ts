import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense/expense.service';
import { SettingsService } from '../../core/services/settings/settings.service';

@Component({
  selector: 'app-expenses',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Egresos</h1>
      <button class="btn btn-primary" (click)="showForm = !showForm">
        {{ showForm ? 'Cancelar' : '+ Nuevo Egreso' }}
      </button>
    </div>

    <div class="card form-card" *ngIf="showForm">
      <h3>Nuevo Egreso</h3>
      <div class="form-grid">
        <div class="form-group">
          <label>Descripción *</label>
          <input [(ngModel)]="newExpense.description" placeholder="Descripción" />
        </div>
        <div class="form-group">
          <label>Monto *</label>
          <input type="number" [(ngModel)]="newExpense.amount" placeholder="0" />
        </div>
        <div class="form-group">
          <label>Categoría *</label>
          <select [(ngModel)]="newExpense.categoryId">
            <option value="">Seleccionar...</option>
            @for (c of categories; track c.id) {
              <option [value]="c.id">{{ c.name }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>Proveedor</label>
          <select [(ngModel)]="newExpense.supplierId">
            <option value="">Seleccionar...</option>
            @for (s of suppliers; track s.id) {
              <option [value]="s.id">{{ s.name }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>Medio de pago *</label>
          <select [(ngModel)]="newExpense.paymentMethodId">
            <option value="">Seleccionar...</option>
            @for (m of paymentMethods; track m.id) {
              <option [value]="m.id">{{ m.name }}</option>
            }
          </select>
        </div>
        <div class="form-group">
          <label>Nro. Factura Proveedor</label>
          <input [(ngModel)]="newExpense.invoiceNumber" placeholder="Ej: FAC-001 (opcional)" />
        </div>
        <div class="form-group">
          <label>Fecha</label>
          <input type="date" [(ngModel)]="newExpense.expenseDate" />
        </div>
        <div class="form-group full-width">
          <label>Notas</label>
          <input [(ngModel)]="newExpense.notes" placeholder="Notas opcionales" />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn btn-primary" (click)="createExpense()" [disabled]="saving">
          {{ saving ? 'Guardando...' : 'Guardar' }}
        </button>
      </div>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input type="text" [(ngModel)]="search" (input)="onSearch()" placeholder="🔍 Buscar por descripción, proveedor o nro factura..." class="search-input" />
      <select [(ngModel)]="filterCategory" (change)="onFilter()">
        <option value="">Todas las categorías</option>
        @for (c of categories; track c.id) {
          <option [value]="c.id">{{ c.name }}</option>
        }
      </select>
    </div>
    <div class="filters date-filters">
      <div class="date-group">
        <label>Desde</label>
        <input type="date" [(ngModel)]="filterFrom" (change)="onFilter()" />
      </div>
      <div class="date-group">
        <label>Hasta</label>
        <input type="date" [(ngModel)]="filterTo" (change)="onFilter()" />
      </div>
      <button class="btn btn-outline btn-sm" *ngIf="filterFrom || filterTo" (click)="clearDates()">✕ Limpiar fechas</button>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Proveedor</th>
            <th>Nro. Factura</th>
            <th>Medio de Pago</th>
            <th class="text-right">Monto</th>
            <th>Fecha</th>
            <th></th>
          </tr>
        </thead>
        <tbody>
          @for (e of expenses; track e.id) {
            <tr>
              <td class="mono">{{ e.number }}</td>
              <td><strong>{{ e.description }}</strong></td>
              <td>{{ e.category?.name || '—' }}</td>
              <td>{{ e.supplier?.name || '—' }}</td>
              <td class="mono">{{ e.invoiceNumber || '—' }}</td>
              <td><span class="badge badge-muted">{{ e.paymentMethod?.name || '—' }}</span></td>
              <td class="text-right expense-amount">$ {{ e.amount | number:'1.0-0' }}</td>
              <td>{{ e.expenseDate | date:'dd/MM/yyyy' }}</td>
              <td>
                <button class="btn-icon" title="Eliminar" (click)="deleteExpense(e.id)">🗑️</button>
              </td>
            </tr>
          }
          @if (expenses.length === 0 && !loading) {
            <tr><td colspan="9" class="empty">No se encontraron egresos</td></tr>
          }
        </tbody>
      </table>

      <div class="pagination" *ngIf="total > limit">
        <button class="btn btn-sm" [disabled]="page <= 1" (click)="changePage(page - 1)">← Anterior</button>
        <span>Página {{ page }} de {{ totalPages }} ({{ total }} resultados)</span>
        <button class="btn btn-sm" [disabled]="page >= totalPages" (click)="changePage(page + 1)">Siguiente →</button>
      </div>
    </div>
  `,
  styleUrl: './expenses.component.scss',
})
export class ExpensesComponent implements OnInit {
  expenses: any[] = [];
  categories: any[] = [];
  suppliers: any[] = [];
  paymentMethods: any[] = [];
  loading = true;
  showForm = false;
  saving = false;
  search = '';
  filterCategory = '';
  filterFrom = '';
  filterTo = '';
  page = 1;
  limit = 20;
  total = 0;
  searchTimeout: any;
  newExpense: any = {
    description: '', amount: 0, categoryId: '', supplierId: '',
    paymentMethodId: '', invoiceNumber: '', expenseDate: '', notes: ''
  };

  get totalPages() { return Math.ceil(this.total / this.limit); }

  constructor(
    private expenseService: ExpenseService,
    private settingsService: SettingsService,
  ) { }

  ngOnInit() {
    this.loadExpenses();
    this.settingsService.getCategories('EXPENSE').subscribe({ next: (res: any) => { this.categories = res.data; } });
    this.settingsService.getSuppliers().subscribe({ next: (res: any) => { this.suppliers = res.data; } });
    this.settingsService.getPaymentMethods().subscribe({ next: (res: any) => { this.paymentMethods = res.data; } });
  }

  loadExpenses() {
    this.loading = true;
    this.expenseService.list({
      categoryId: this.filterCategory,
      search: this.search,
      from: this.filterFrom,
      to: this.filterTo,
      page: this.page,
      limit: this.limit,
    }).subscribe({
      next: (res: any) => {
        this.expenses = res.data;
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
      this.loadExpenses();
    }, 400);
  }

  onFilter() {
    this.page = 1;
    this.loadExpenses();
  }

  clearDates() {
    this.filterFrom = '';
    this.filterTo = '';
    this.onFilter();
  }

  changePage(p: number) {
    this.page = p;
    this.loadExpenses();
  }

  createExpense() {
    if (!this.newExpense.description || !this.newExpense.amount) return;
    this.saving = true;
    const payload = { ...this.newExpense };
    if (!payload.categoryId) delete payload.categoryId;
    if (!payload.supplierId) delete payload.supplierId;
    if (!payload.paymentMethodId) delete payload.paymentMethodId;
    if (!payload.invoiceNumber) delete payload.invoiceNumber;
    if (!payload.expenseDate) delete payload.expenseDate;
    this.expenseService.create(payload).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.newExpense = {
          description: '', amount: 0, categoryId: '', supplierId: '',
          paymentMethodId: '', invoiceNumber: '', expenseDate: '', notes: ''
        };
        this.loadExpenses();
      },
      error: () => { this.saving = false; },
    });
  }

  deleteExpense(id: string) {
    if (!confirm('¿Eliminar este egreso?')) return;
    this.expenseService.delete(id).subscribe({ next: () => this.loadExpenses() });
  }
}
