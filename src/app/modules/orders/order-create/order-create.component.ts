import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order/order.service';
import { CustomerService } from '../../../core/services/customer/customer.service';
import { SettingsService } from '../../../core/services/settings/settings.service';
import { ProductService } from '../../../core/services/product/product.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AppConfigService } from '../../../core/services/app-config/app-config.service';
import { MaterialCalculatorComponent } from '../../../shared/components/material-calculator/material-calculator.component';
import { ItemCompositionCalculatorComponent } from '../../../shared/components/material-calculator/item-composition-calculator.component';
import { OverlayModule } from '@angular/cdk/overlay';

interface OrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
  composition?: any[];
}

@Component({
    selector: 'app-order-create',
    imports: [CommonModule, FormsModule, OverlayModule, MaterialCalculatorComponent, ItemCompositionCalculatorComponent],
    templateUrl: './order-create.component.html',
    styleUrl: './order-create.component.scss'
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

  // Product picker
  showProductPicker = false;
  productSearch = '';
  productResults: any[] = [];
  productSearchTimeout: any;

  // O3: Inline customer creation
  showCreateCustomer = false;
  savingCustomer = false;
  createCustomerError = '';
  newCustomer = { identification: '', name: '', phone: '', email: '', address: '' };

  // Material calculator
  showMaterialCalc = false;
  calcItemIndex = -1;

  // Composition calculator
  showCompositionCalc = false;
  compItemIndex = -1;

  get subtotal() {
    return this.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
  }

  constructor(
    private router: Router,
    private orderService: OrderService,
    private customerService: CustomerService,
    private settingsService: SettingsService,
    private productService: ProductService,
    private authService: AuthService,
    public config: AppConfigService,
  ) { }

  ngOnInit() {
    this.authService.getSession().subscribe({
      next: (session: any) => {
        if (session?.user) {
          this.sellerDisplayName = `${session.user.firstName} ${session.user.lastName}`;
          // O2: Check discount permission
          this.canApplyDiscount = session.user.systemRole === 'admin' || (session.tenant?.permissions || []).some(
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

  closeCustomerDropdown() {
    this.customerResults = [];
  }

  addItem() {
    this.items.push({ description: '', quantity: 1, unitPrice: 0 });
  }

  removeItem(i: number) {
    this.items.splice(i, 1);
  }

  // Product picker
  openProductPicker() {
    this.showProductPicker = true;
    this.productSearch = '';
    this.productResults = [];
    this.searchProductsNow();
  }

  searchProducts() {
    clearTimeout(this.productSearchTimeout);
    this.productSearchTimeout = setTimeout(() => this.searchProductsNow(), 300);
  }

  searchProductsNow() {
    this.productService.list(this.productSearch || undefined).subscribe({
      next: (res: any) => { this.productResults = res.data; },
    });
  }

  addProductItem(product: any) {
    this.items.push({
      description: product.name + (product.description ? ' — ' + product.description : ''),
      quantity: 1,
      unitPrice: parseFloat(product.basePrice) || 0,
      productId: product.id,
    });
    this.showProductPicker = false;
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

    const phone = this.newCustomer.phone?.trim();
    if (phone && !/^3\d{9}$/.test(phone)) {
      this.createCustomerError = 'El teléfono debe tener 10 dígitos, empezar por 3 y no contener espacios';
      return;
    }

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

  // ─── Material Calculator ─────────────────────────────────

  openMaterialCalc(index: number) {
    this.calcItemIndex = index;
    this.showMaterialCalc = true;
  }

  onCalcPriceApplied(price: number) {
    if (this.calcItemIndex >= 0 && this.calcItemIndex < this.items.length) {
      this.items[this.calcItemIndex].unitPrice = price;
    }
    this.showMaterialCalc = false;
  }

  closeMaterialCalc() {
    this.showMaterialCalc = false;
  }

  // ─── Item Composition Calculator ─────────────────────────

  openCompositionCalc(index: number) {
    this.compItemIndex = index;
    this.showCompositionCalc = true;
  }

  onCompositionApplied(data: {materials: any[], unitPrice: number}) {
    if (this.compItemIndex >= 0 && this.compItemIndex < this.items.length) {
      this.items[this.compItemIndex].unitPrice = data.unitPrice;
      this.items[this.compItemIndex].composition = data.materials;
    }
    this.showCompositionCalc = false;
  }

  removeMaterialFromComposition(item: any, materialIndex: number, itemIndex: number) {
    if (item.composition && item.composition.length > 0) {
      item.composition.splice(materialIndex, 1);
      // Recalculate item unit price
      item.unitPrice = item.composition.reduce((sum: number, c: any) => sum + (c.subtotal || 0), 0);
    }
  }
}
