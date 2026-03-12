import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { OrderService } from '../../../core/services/order/order.service';
import { CustomerService } from '../../../core/services/customer/customer.service';
import { SettingsService } from '../../../core/services/settings/settings.service';
import { ProductService } from '../../../core/services/product/product.service';
import { MaterialService } from '../../../core/services/material/material.service';
import { AuthService } from '../../../core/services/auth/auth.service';
import { AppConfigService } from '../../../core/services/app-config/app-config.service';
import { OverlayModule } from '@angular/cdk/overlay';

interface OrderItem {
  description: string;
  quantity: number;
  unitPrice: number;
  productId?: string;
}

interface CalcMaterial {
  material: any;
  quantityExpr: string;
  quantity: number;
  factor: number;
  subtotal: number;
}

@Component({
  selector: 'app-order-create',
  standalone: true,
  imports: [CommonModule, FormsModule, OverlayModule],
  templateUrl: './order-create.component.html',
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
  calcMaterials: CalcMaterial[] = [];
  calcGlobalFactor = 1;
  calcMaterialSearch = '';
  calcMaterialResults: any[] = [];
  calcMaterialSearchTimeout: any;

  get subtotal() {
    return this.items.reduce((sum, i) => sum + (i.quantity * i.unitPrice), 0);
  }

  get calcMaterialsSum() {
    return this.calcMaterials.reduce((sum, cm) => sum + cm.subtotal, 0);
  }

  get calcTotal() {
    return this.calcMaterialsSum * this.calcGlobalFactor;
  }

  constructor(
    private router: Router,
    private orderService: OrderService,
    private customerService: CustomerService,
    private settingsService: SettingsService,
    private productService: ProductService,
    private materialService: MaterialService,
    private authService: AuthService,
    public config: AppConfigService,
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
    this.calcMaterials = [];
    this.calcGlobalFactor = 1;
    this.calcMaterialSearch = '';
    this.calcMaterialResults = [];
    this.showMaterialCalc = true;
    this.searchCalcMaterialsNow();
  }

  searchCalcMaterials() {
    clearTimeout(this.calcMaterialSearchTimeout);
    this.calcMaterialSearchTimeout = setTimeout(() => this.searchCalcMaterialsNow(), 300);
  }

  searchCalcMaterialsNow() {
    this.materialService.list(this.calcMaterialSearch || undefined).subscribe({
      next: (res: any) => { this.calcMaterialResults = res.data; },
    });
  }

  addCalcMaterial(material: any) {
    this.calcMaterials.push({
      material,
      quantityExpr: '1',
      quantity: 1,
      factor: 1,
      subtotal: parseFloat(material.price) || 0,
    });
    this.calcMaterialSearch = '';
    this.recalcAll();
  }

  removeCalcMaterial(i: number) {
    this.calcMaterials.splice(i, 1);
    this.recalcAll();
  }

  /**
   * Evaluate a simple math expression for quantity.
   * Supports: +, -, *, x, X (as multiply)
   * Examples: "3x2" → 6, "1.5*4" → 6, "2+3" → 5, "10" → 10
   */
  evalQuantity(expr: string): number {
    if (!expr || !expr.trim()) return 0;
    try {
      // Replace x/X with * for multiplication
      const sanitized = expr.replace(/[xX]/g, '*');
      // Only allow digits, dots, +, -, *, /, spaces
      if (!/^[\d\s+\-*/.,]+$/.test(sanitized)) return 0;
      const result = Function('"use strict"; return (' + sanitized + ')')();
      return typeof result === 'number' && isFinite(result) ? result : 0;
    } catch {
      return 0;
    }
  }

  onQuantityExprChange(cm: CalcMaterial) {
    cm.quantity = this.evalQuantity(cm.quantityExpr);
    this.recalcMaterial(cm);
  }

  onFactorChange(cm: CalcMaterial) {
    this.recalcMaterial(cm);
  }

  onGlobalFactorChange() {
    // Global factor doesn't change individual subtotals, only the total
  }

  recalcMaterial(cm: CalcMaterial) {
    const price = parseFloat(cm.material.price) || 0;
    cm.subtotal = price * cm.quantity * cm.factor;
  }

  recalcAll() {
    this.calcMaterials.forEach(cm => this.recalcMaterial(cm));
  }

  applyCalcToItem() {
    if (this.calcItemIndex >= 0 && this.calcItemIndex < this.items.length) {
      this.items[this.calcItemIndex].unitPrice = Math.round(this.calcTotal * 100) / 100;
    }
    this.showMaterialCalc = false;
  }

  closeMaterialCalc() {
    this.showMaterialCalc = false;
  }
}
