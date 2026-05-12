import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { ExpenseService } from '../../core/services/expense/expense.service';
import { SettingsService } from '../../core/services/settings/settings.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { extractDateFromISO } from '../../shared/utils/date-utils';

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

  // File attachment
  selectedFile: File | null = null;

  get totalPages() { return Math.ceil(this.total / this.limit); }

  constructor(
    private expenseService: ExpenseService,
    private settingsService: SettingsService,
    public config: AppConfigService,
    private toastService: ToastService,
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
        this.expenses = res.data || [];
        this.total = res.total || 0;
        this.loading = false;
        // Attachments are NOT pre-loaded here — they are fetched on-demand
        // when the user clicks the icon or opens the edit modal.
      },
      error: () => { this.loading = false; },
    });
  }

  /**
   * Called when the user clicks the attachment icon in the table row.
   * Loads attachments on-demand (single request) then opens the first one.
   */
  viewAttachmentForExpense(expense: any, event: Event) {
    event.stopPropagation();
    // If already loaded (e.g. user re-clicks), open directly
    if (expense.attachments && expense.attachments.length > 0) {
      this.viewAttachment(expense.attachments[0]);
      return;
    }
    this.expenseService.getAttachments(expense.id).subscribe({
      next: (res: any) => {
        expense.attachments = res.data || [];
        if (expense.attachments.length > 0) {
          this.viewAttachment(expense.attachments[0]);
        } else {
          this.toastService.warning('Sin soporte', 'Este egreso no tiene soportes adjuntos.');
        }
      },
      error: () => {
        this.toastService.error('Error', 'No se pudo cargar el soporte.');
      }
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

  setToday() {
    const today = new Date().toISOString().split('T')[0];
    this.filterFrom = today;
    this.filterTo = today;
    this.onFilter();
  }

  closeCreateModal() {
    this.showForm = false;
    this.newExpense = {
      description: '', amount: 0, categoryId: '', supplierId: '',
      paymentMethodId: '', invoiceNumber: '', expenseDate: '', notes: ''
    };
    this.selectedFile = null;
  }

  closeEditModal() {
    this.editingExpense = null;
    this.editData = {};
    this.editSelectedFile = null;
  }

  changePage(p: number) {
    this.page = p;
    this.loadExpenses();
  }

  // File handling methods for CREATE
  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error('Archivo demasiado grande', 'El archivo es demasiado grande. Máximo 10MB.');
        return;
      }

      this.selectedFile = file;
    }
  }

  removeFile() {
    this.selectedFile = null;
  }

  // File handling methods for EDIT
  editSelectedFile: File | null = null;

  onEditFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      const file = input.files[0];

      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        this.toastService.error('Archivo demasiado grande', 'El archivo es demasiado grande. Máximo 10MB.');
        return;
      }

      this.editSelectedFile = file;
    }
  }

  removeEditFile() {
    this.editSelectedFile = null;
  }

  // View attachment
  viewAttachment(attachment: any) {
    // Use presigned downloadUrl if available, otherwise fall back to fileUrl
    const url = attachment.downloadUrl || attachment.fileUrl;
    if (url) {
      window.open(url, '_blank');
    } else {
      this.toastService.error('Error', 'No se puede acceder al archivo');
    }

  }

  formatFileSize(bytes: number): string {
    return this.expenseService.formatFileSize(bytes);
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

    this.expenseService.create(payload, this.selectedFile || undefined).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.showForm = false;
        this.newExpense = {
          description: '', amount: 0, categoryId: '', supplierId: '',
          paymentMethodId: '', invoiceNumber: '', expenseDate: '', notes: ''
        };
        this.selectedFile = null;

        // Show warning if some files failed
        if (res.warnings?.failed?.length > 0) {
          this.toastService.warning('Soporte no subido', 'Egreso creado, pero el soporte no pudo subirse. Puedes intentar de nuevo.');
        } else if (this.selectedFile) {
          this.toastService.success('Éxito', 'Egreso y soporte creados exitosamente');
        } else {
          this.toastService.success('Éxito', 'Egreso creado exitosamente');
        }

        this.loadExpenses();
      },
      error: (err: any) => {
        this.saving = false;
        this.toastService.error('Error', 'Error al crear el egreso');
      },
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
      expenseDate: extractDateFromISO(expense.expenseDate),
      notes: expense.notes || '',
    };

    // Load attachments for this expense
    this.loadExpenseAttachments(expense.id);
  }

  loadExpenseAttachments(expenseId: string) {
    this.expenseService.getAttachments(expenseId).subscribe({
      next: (res: any) => {
        if (this.editingExpense) {
          this.editingExpense.attachments = res.data;
        }
      },
      error: () => {
        // Silently fail - attachments are optional
      }
    });
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
