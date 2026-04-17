import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ExpenseService } from '../../core/services/expense/expense.service';
import { SettingsService } from '../../core/services/settings/settings.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';

@Component({
    selector: 'app-expenses',
    imports: [CommonModule, FormsModule],
    templateUrl: './expenses.component.html',
    styleUrl: './expenses.component.scss'
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
    public config: AppConfigService,
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

  // Edit expense
  editingExpense: any = null;
  savingEdit = false;
  editData: any = {};

  startEditExpense(expense: any) {
    this.editingExpense = expense;
    this.editData = {
      description: expense.description || '',
      amount: parseFloat(expense.amount),
      categoryId: expense.categoryId || expense.category?.id || '',
      supplierId: expense.supplierId || expense.supplier?.id || '',
      paymentMethodId: expense.paymentMethodId || expense.paymentMethod?.id || '',
      invoiceNumber: expense.invoiceNumber || '',
      expenseDate: expense.expenseDate ? new Date(expense.expenseDate).toISOString().split('T')[0] : '',
      notes: expense.notes || '',
    };
  }

  saveExpenseEdit() {
    if (!this.editingExpense) return;
    this.savingEdit = true;
    this.expenseService.update(this.editingExpense.id, this.editData).subscribe({
      next: () => {
        this.savingEdit = false;
        this.editingExpense = null;
        this.loadExpenses();
      },
      error: () => { this.savingEdit = false; },
    });
  }
}
