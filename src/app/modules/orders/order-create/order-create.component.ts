import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order/order.service';
import { CustomerService } from '../../../core/services/customer/customer.service';
import { SettingsService } from '../../../core/services/settings/settings.service';

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
          <h3>Cliente</h3>
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
              <input type="text" [(ngModel)]="sellerName" placeholder="Nombre del vendedor" />
            </div>
            <div class="form-group">
              <label>Fecha de vencimiento</label>
              <input type="date" [(ngModel)]="dueDate" />
            </div>
            <div class="form-group">
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
  `,
    styleUrl: './order-create.component.scss',
})
export class OrderCreateComponent implements OnInit {
    customerSearch = '';
    customerResults: any[] = [];
    selectedCustomer: any = null;

    items: OrderItem[] = [{ description: '', quantity: 1, unitPrice: 0 }];
    sellerName = '';
    dueDate = '';
    discount = 0;
    notes = '';
    saving = false;
    searchTimeout: any;

    get subtotal() {
        return this.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
    }

    constructor(
        private router: Router,
        private orderService: OrderService,
        private customerService: CustomerService,
        private settingsService: SettingsService,
    ) { }

    ngOnInit() { }

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
            sellerName: this.sellerName,
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
}
