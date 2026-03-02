import { Component, OnInit, HostListener, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order/order.service';
import { PaymentService } from '../../../core/services/payment/payment.service';
import { SettingsService } from '../../../core/services/settings/settings.service';
import { AppConfigService } from '../../../core/services/app-config/app-config.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './order-detail.component.html',
  styleUrl: './order-detail.component.scss',
})
export class OrderDetailComponent implements OnInit {
  order: any = null;
  loading = true;
  showPaymentForm = false;
  savingPayment = false;
  paymentMethods: any[] = [];
  newPayment = { paymentMethodId: '', amount: 0, notes: '' };
  printMode: 'production' | 'customer' | null = null;
  today = new Date();
  updatingStatus = false;
  actionsOpen = false;

  // Edit order
  editingOrder = false;
  savingOrder = false;
  editOrderData: any = { notes: '', dueDate: '', items: [] };
  editSubtotal = 0;

  // Edit payment
  editingPayment: any = null;
  editPaymentData: any = { paymentMethodId: '', amount: 0, notes: '' };

  // O10: Operational status steps
  operationalSteps = [
    { key: 'PENDING', label: 'Pendiente' },
    { key: 'APPROVED', label: 'Aprobada' },
    { key: 'IN_PRODUCTION', label: 'En Producción' },
    { key: 'PRODUCED', label: 'Producida' },
    { key: 'DELIVERED', label: 'Entregada' },
  ];


  @HostListener('document:click', ['$event'])
  onDocClick(event: MouseEvent) {
    if (this.actionsOpen && !this.el.nativeElement.querySelector('.actions-dropdown')?.contains(event.target)) {
      this.actionsOpen = false;
    }
  }

  get currentStepIndex(): number {
    return this.operationalSteps.findIndex(s => s.key === this.order?.operationalStatus) || 0;
  }

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private settingsService: SettingsService,
    private el: ElementRef,
    public config: AppConfigService,
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id')!;
    this.loadOrder(id);
    this.settingsService.getPaymentMethods().subscribe({
      next: (res: any) => { this.paymentMethods = res.data; },
    });
  }

  loadOrder(id: string) {
    this.loading = true;
    this.orderService.get(id).subscribe({
      next: (res: any) => {
        this.order = res.data;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  registerPayment() {
    if (!this.newPayment.paymentMethodId || !this.newPayment.amount) return;
    this.savingPayment = true;
    this.paymentService.create({
      orderId: this.order.id,
      ...this.newPayment,
    }).subscribe({
      next: () => {
        this.savingPayment = false;
        this.showPaymentForm = false;
        this.newPayment = { paymentMethodId: '', amount: 0, notes: '' };
        this.loadOrder(this.order.id);
      },
      error: () => { this.savingPayment = false; },
    });
  }

  cancelOrder() {
    const reason = prompt('Razón de anulación:');
    if (!reason) return;
    this.orderService.cancel(this.order.id, reason).subscribe({
      next: () => { this.loadOrder(this.order.id); },
    });
  }

  // Edit order
  toggleEditOrder() {
    this.editingOrder = !this.editingOrder;
    if (this.editingOrder) {
      this.editOrderData = {
        notes: this.order.notes || '',
        dueDate: this.order.dueDate ? new Date(this.order.dueDate).toISOString().split('T')[0] : '',
        items: (this.order.items || []).map((item: any) => ({
          productId: item.productId,
          description: item.description,
          quantity: parseFloat(item.quantity),
          unitPrice: parseFloat(item.unitPrice),
        })),
      };
      this.recalcEditTotals();
    }
  }

  addEditItem() {
    this.editOrderData.items.push({ productId: null, description: '', quantity: 1, unitPrice: 0 });
  }

  removeEditItem(index: number) {
    this.editOrderData.items.splice(index, 1);
    this.recalcEditTotals();
  }

  recalcEditTotals() {
    this.editSubtotal = (this.editOrderData.items || []).reduce(
      (sum: number, item: any) => sum + (parseFloat(item.quantity) || 0) * (parseFloat(item.unitPrice) || 0), 0
    );
  }

  saveOrderEdit() {
    this.savingOrder = true;
    this.orderService.update(this.order.id, {
      notes: this.editOrderData.notes,
      dueDate: this.editOrderData.dueDate,
      items: this.editOrderData.items,
    }).subscribe({
      next: (res: any) => {
        this.order = res.data;
        this.savingOrder = false;
        this.editingOrder = false;
      },
      error: () => { this.savingOrder = false; },
    });
  }

  // Edit payment
  startEditPayment(payment: any) {
    this.editingPayment = payment;
    this.editPaymentData = {
      paymentMethodId: payment.paymentMethodId || payment.paymentMethod?.id,
      amount: parseFloat(payment.amount),
      notes: payment.notes || '',
    };
  }

  savePaymentEdit() {
    if (!this.editingPayment) return;
    this.savingPayment = true;
    this.paymentService.update(this.editingPayment.id, this.editPaymentData).subscribe({
      next: () => {
        this.savingPayment = false;
        this.editingPayment = null;
        this.loadOrder(this.order.id);
      },
      error: () => { this.savingPayment = false; },
    });
  }

  deletePayment(payment: any) {
    if (!confirm(`¿Eliminar pago de $${parseFloat(payment.amount).toLocaleString()}? Esta acción revertirá el saldo de la orden.`)) return;
    this.paymentService.delete(payment.id).subscribe({
      next: () => { this.loadOrder(this.order.id); },
    });
  }

  // O10: Change operational status
  changeOperationalStatus(direction: number) {
    const nextIndex = this.currentStepIndex + direction;
    if (nextIndex < 0 || nextIndex >= this.operationalSteps.length) return;

    const nextStatus = this.operationalSteps[nextIndex].key;
    this.updatingStatus = true;
    this.orderService.updateOperationalStatus(this.order.id, nextStatus).subscribe({
      next: (res: any) => {
        this.order.operationalStatus = res.data.operationalStatus;
        this.updatingStatus = false;
      },
      error: () => { this.updatingStatus = false; },
    });
  }

  // Print order
  printOrder(mode: 'production' | 'customer') {
    this.printMode = mode;
    document.body.classList.add('printing', `print-${mode}`);
    setTimeout(() => {
      window.print();
      setTimeout(() => {
        document.body.classList.remove('printing', `print-${mode}`);
        this.printMode = null;
      }, 500);
    }, 100);
  }
}
