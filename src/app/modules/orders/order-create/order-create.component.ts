import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order/order.service';
import { CustomerService } from '../../../core/services/customer/customer.service';
import { SettingsService } from '../../../core/services/settings/settings.service';
import { AuthService } from '../../../core/services/auth/auth.service';

interface OrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
}

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="create-page">
      <div class="page-header">
        <h1>Nueva Orden</h1>
      </div>

      <div class="form-sections">
        <!-- Customer -->
        <div class="card section">
          <div class="section-header">
            <h3>Cliente</h3>
            <button class="btn btn-outline btn-sm" (click)="showCreateCustomer = true">+ Nuevo Cliente</button>
          </div>
          <div class="form-grid">
            <div class="form-group">
              <label>Buscar cliente</label>
              <input type="text" [(ngModel)]="customerSearch" (input)="searchCustomers()" placeholder="Nombre o NIT..." />
              <div class="dropdown" *ngIf="customerResults.length > 0">
                @for (c of customerResults; track c.id) {
                  <div class="dropdown-item" (click)="selectCustomer(c)">
                    <strong>{{ c.name }}</strong> <span>{{ c.identification }}</span>
                  </div>
                }
              </div>
            </div>
            <div class="form-group" *ngIf="selectedCustomer">
              <label>Seleccionado</label>
              <div class="selected-tag">
                {{ selectedCustomer.name }} ({{ selectedCustomer.identification }})
                <button class="tag-remove" (click)="selectedCustomer = null">×</button>
              </div>
            </div>
          </div>
        </div>

        <!-- Items -->
        <div class="card section">
          <div class="section-header">
            <h3>Items</h3>
            <button class="btn btn-outline btn-sm" (click)="addItem()">+ Item</button>
          </div>
          <div class="items-list">
            @for (item of items; track $index; let i = $index) {
              <div class="item-row">
                <input type="text" [(ngModel)]="item.description" placeholder="Descripción *" class="flex-2" />
                <input type="number" [(ngModel)]="item.quantity" min="1" placeholder="Cant." class="w-80" />
                <input type="number" [(ngModel)]="item.unitPrice" min="0" placeholder="Precio" class="w-120" />
                <span class="item-total">$ {{ (item.quantity * item.unitPrice) | number:'1.0-0' }}</span>
                <button class="btn-icon" (click)="removeItem(i)" *ngIf="items.length > 1">🗑️</button>
              </div>
            }
          </div>
        </div>

        <!-- Totals & Details -->
        <div class="card section">
          <h3>Detalles</h3>
          <div class="form-grid">
            <div class="form-group">
              <label>Vendedor</label>
              <div class="seller-readonly">
                <span class="seller-badge">👤 {{ sellerDisplayName || 'Cargando...' }}</span>
                <span class="seller-hint">Asignado automáticamente</span>
              </div>
            </div>
            <div class="form-group">
              <label>Fecha de vencimiento</label>
              <input type="date" [(ngModel)]="dueDate" />
            </div>
            <div class="form-group" *ngIf="canApplyDiscount">
              <label>Descuento</label>
              <input type="number" [(ngModel)]="discount" min="0" placeholder="0" />
            </div>
            <div class="form-group full-width">
              <label>Notas</label>
              <textarea [(ngModel)]="notes" rows="2" placeholder="Notas opcionales..."></textarea>
            </div>
          </div>
          <div class="total-bar">
            <span>Subtotal: $ {{ subtotal | number:'1.0-0' }}</span>
            <span>Descuento: $ {{ discount | number:'1.0-0' }}</span>
            <strong>Total: $ {{ subtotal - discount | number:'1.0-0' }}</strong>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn btn-outline" (click)="cancel()">Cancelar</button>
          <button class="btn btn-primary" (click)="createOrder()" [disabled]="saving || !selectedCustomer || items.length === 0">
            {{ saving ? 'Guardando...' : 'Crear Orden' }}
          </button>
        </div>
      </div>
    </div>

    <!-- Create Customer Modal (O3) -->
    <div class="modal-overlay" *ngIf="showCreateCustomer" (click)="showCreateCustomer = false">
      <div class="modal-content modal-lg" (click)="$event.stopPropagation()">
        <div class="modal-header">
          <h3>Crear Nuevo Cliente</h3>
          <button class="btn-close" (click)="showCreateCustomer = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-grid">
            <div class="form-group">
              <label>Identificación (NIT/CC) *</label>
              <input type="text" [(ngModel)]="newCustomer.identification" placeholder="Ej: 900123456-1" />
            </div>
            <div class="form-group">
              <label>Nombre / Razón Social *</label>
              <input type="text" [(ngModel)]="newCustomer.name" placeholder="Nombre del cliente" />
            </div>
            <div class="form-group">
              <label>Teléfono</label>
              <input type="text" [(ngModel)]="newCustomer.phone" placeholder="Teléfono" />
            </div>
            <div class="form-group">
              <label>Email</label>
              <input type="email" [(ngModel)]="newCustomer.email" placeholder="email@ejemplo.com" />
            </div>
            <div class="form-group full-width">
              <label>Dirección</label>
              <input type="text" [(ngModel)]="newCustomer.address" placeholder="Dirección" />
            </div>
          </div>
          <p class="error-msg" *ngIf="createCustomerError">{{ createCustomerError }}</p>
        </div>
        <div class="modal-actions">
          <button class="btn btn-outline" (click)="showCreateCustomer = false">Cancelar</button>
          <button class="btn btn-primary" (click)="saveNewCustomer()" [disabled]="savingCustomer || !newCustomer.identification || !newCustomer.name">
            {{ savingCustomer ? 'Guardando...' : 'Crear y Seleccionar' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './order-create.component.scss',
})
export class OrderCreateComponent implements OnInit {
  customerSearch = '';
  customerResults: any[] = [];
  selectedCustomer: any = null;

  items: OrderItem[] = [{ description: '', quantity: 1, unitPrice: 0 }];
  sellerDisplayName = '';
  canApplyDiscount = false;
  dueDate = '';
  discount = 0;
  notes = '';
  saving = false;
  searchTimeout: any;

  // O3: Inline customer creation
  showCreateCustomer = false;
  savingCustomer = false;
  createCustomerError = '';
  newCustomer = { identification: '', name: '', phone: '', email: '', address: '' };

  get subtotal() {
    return this.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
  }

  constructor(
    private router: Router,
    private orderService: OrderService,
    private customerService: CustomerService,
    private settingsService: SettingsService,
    private authService: AuthService,
  ) { }

  ngOnInit() {
    this.authService.getSession().subscribe({
      next: (session: any) => {
        if (session?.user) {
          this.sellerDisplayName = `${session.user.firstName} ${session.user.lastName}`;
          // O2: Check discount permission
          this.canApplyDiscount = session.user.isSuperAdmin || (session.tenant?.permissions || []).some(
            (p: any) => p.resource === 'orders' && p.action === 'apply_discount'
          );
        }
      },
    });
  }

  searchCustomers() {
    clearTimeout(this.searchTimeout);
    this.searchTimeout = setTimeout(() => {
      if (this.customerSearch.length < 2) {
        this.customerResults = [];
        return;
      }
      this.customerService.list({ search: this.customerSearch, limit: 5 }).subscribe({
        next: (res: any) => { this.customerResults = res.data; },
      });
    }, 300);
  }

  selectCustomer(c: any) {
    this.selectedCustomer = c;
    this.customerResults = [];
    this.customerSearch = '';
  }

  addItem() {
    this.items.push({ description: '', quantity: 1, unitPrice: 0 });
  }

  removeItem(i: number) {
    this.items.splice(i, 1);
  }

  cancel() {
    this.router.navigate(['/orders']);
  }

  createOrder() {
    if (!this.selectedCustomer || this.items.length === 0) return;
    this.saving = true;
    this.orderService.create({
      customerId: this.selectedCustomer.id,
      items: this.items.filter((i) => i.description),
      dueDate: this.dueDate || undefined,
      discount: this.discount,
      notes: this.notes,
    }).subscribe({
      next: (res: any) => {
        this.saving = false;
        this.router.navigate(['/orders', res.data.id]);
      },
      error: () => { this.saving = false; },
    });
  }

  // O3: Save new customer and auto-select
  saveNewCustomer() {
    if (!this.newCustomer.identification || !this.newCustomer.name) return;
    this.savingCustomer = true;
    this.createCustomerError = '';

    this.customerService.create(this.newCustomer).subscribe({
      next: (res: any) => {
        this.savingCustomer = false;
        this.showCreateCustomer = false;
        // Auto-select the newly created customer
        this.selectedCustomer = res.data;
        this.customerSearch = '';
        this.customerResults = [];
        // Reset form
        this.newCustomer = { identification: '', name: '', phone: '', email: '', address: '' };
      },
      error: (err: any) => {
        this.savingCustomer = false;
        this.createCustomerError = err.error?.error || 'Error al crear el cliente';
      },
    });
  }
}
