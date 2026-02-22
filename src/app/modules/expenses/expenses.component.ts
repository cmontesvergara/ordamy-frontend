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
          <label>Categoría</label>
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
          <label>Medio de pago</label>
          <select [(ngModel)]="newExpense.paymentMethodId">
            <option value="">Seleccionar...</option>
            @for (m of paymentMethods; track m.id) {
              <option [value]="m.id">{{ m.name }}</option>
            }
          </select>
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
      <select [(ngModel)]="filterCategory" (change)="loadExpenses()">
        <option value="">Todas las categorías</option>
        @for (c of categories; track c.id) {
          <option [value]="c.id">{{ c.name }}</option>
        }
      </select>
      <input type="date" [(ngModel)]="filterFrom" (change)="loadExpenses()" />
      <input type="date" [(ngModel)]="filterTo" (change)="loadExpenses()" />
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Descripción</th>
            <th>Categoría</th>
            <th>Proveedor</th>
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
              <td class="text-right">$ {{ e.amount | number:'1.0-0' }}</td>
              <td>{{ e.expenseDate | date:'dd/MM/yyyy' }}</td>
              <td>
                <button class="btn-icon" title="Eliminar" (click)="deleteExpense(e.id)">🗑️</button>
              </td>
            </tr>
          }
          @if (expenses.length === 0 && !loading) {
            <tr><td colspan="7" class="empty">No se encontraron egresos</td></tr>
          }
        </tbody>
      </table>
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
    filterCategory = '';
    filterFrom = '';
    filterTo = '';
    newExpense: any = { description: '', amount: 0, categoryId: '', supplierId: '', paymentMethodId: '', notes: '' };

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
            from: this.filterFrom,
            to: this.filterTo,
        }).subscribe({
            next: (res: any) => { this.expenses = res.data; this.loading = false; },
            error: () => { this.loading = false; },
        });
    }

    createExpense() {
        if (!this.newExpense.description || !this.newExpense.amount) return;
        this.saving = true;
        const payload = { ...this.newExpense };
        if (!payload.categoryId) delete payload.categoryId;
        if (!payload.supplierId) delete payload.supplierId;
        if (!payload.paymentMethodId) delete payload.paymentMethodId;
        this.expenseService.create(payload).subscribe({
            next: () => {
                this.saving = false;
                this.showForm = false;
                this.newExpense = { description: '', amount: 0, categoryId: '', supplierId: '', paymentMethodId: '', notes: '' };
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
