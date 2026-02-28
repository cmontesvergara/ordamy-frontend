import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { OrderService } from '../../../core/services/order/order.service';
import { PaymentService } from '../../../core/services/payment/payment.service';
import { SettingsService } from '../../../core/services/settings/settings.service';

@Component({
  selector: 'app-order-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="order" class="detail-page">
      <div class="page-header no-print">
        <div>
          <h1>Orden #{{ order.number }}</h1>
          <span class="badge status-{{ order.status }}">{{ order.status }}</span>
        </div>
        <div class="header-actions">
          <button class="btn btn-outline btn-sm" (click)="printOrder('production')" title="Para producción (sin precios)">
            🏭 Imprimir Producción
          </button>
          <button class="btn btn-outline btn-sm" (click)="printOrder('customer')" title="Con todos los detalles">
            🧾 Imprimir Cliente
          </button>
          <button *ngIf="order.status === 'ACTIVE'" class="btn btn-danger" (click)="cancelOrder()">
            Anular Orden
          </button>
        </div>
      </div>

      <!-- Print Header (only visible when printing) -->
      <div class="print-header" id="print-header">
        <h2>{{ printMode === 'production' ? 'Orden de Producción' : 'Orden de Servicio' }}</h2>
        <div class="print-meta">
          <span><strong>Orden #{{ order.number }}</strong></span>
          <span>Fecha: {{ order.orderDate | date:'dd/MM/yyyy' }}</span>
          <span *ngIf="order.dueDate">Vence: {{ order.dueDate | date:'dd/MM/yyyy' }}</span>
        </div>
      </div>

      <!-- Info Grid -->
      <div class="info-grid">
        <div class="info-card">
          <h4>Cliente</h4>
          <p><strong>{{ order.customer?.name }}</strong></p>
          <p class="sub">{{ order.customer?.identification }}</p>
          <p class="sub" *ngIf="order.customer?.phone">📞 {{ order.customer.phone }}</p>
        </div>
        <div class="info-card" [class.hide-on-production]="printMode === 'production'">
          <h4>Resumen</h4>
          <div class="summary-row"><span>Subtotal</span><span>$ {{ order.subtotal | number:'1.0-0' }}</span></div>
          <div class="summary-row"><span>IVA ({{ order.taxRate * 100 }}%)</span><span>$ {{ order.taxAmount | number:'1.0-0' }}</span></div>
          <div class="summary-row" *ngIf="order.discount > 0"><span>Descuento</span><span>-$ {{ order.discount | number:'1.0-0' }}</span></div>
          <div class="summary-row total"><span>Total</span><span>$ {{ order.total | number:'1.0-0' }}</span></div>
          <div class="summary-row balance"><span>Saldo</span><span>$ {{ order.balance | number:'1.0-0' }}</span></div>
        </div>
        <div class="info-card">
          <h4>Detalles</h4>
          <p class="sub">Fecha: {{ order.orderDate | date:'dd/MM/yyyy' }}</p>
          <p class="sub" *ngIf="order.dueDate">Vence: {{ order.dueDate | date:'dd/MM/yyyy' }}</p>
          <p class="sub">Vendedor: {{ order.sellerName }}</p>
          <p class="sub" *ngIf="order.notes">Notas: {{ order.notes }}</p>
        </div>
      </div>

      <!-- Items -->
      <div class="card section">
        <h3>Items ({{ order.items?.length }})</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Descripción</th>
              <th>Producto</th>
              <th class="text-right">Cant.</th>
              <th class="text-right hide-on-production">P. Unit.</th>
              <th class="text-right hide-on-production">Total</th>
            </tr>
          </thead>
          <tbody>
            @for (item of order.items; track item.id) {
              <tr>
                <td>{{ item.description }}</td>
                <td>{{ item.product?.name || '—' }}</td>
                <td class="text-right">{{ item.quantity }}</td>
                <td class="text-right hide-on-production">$ {{ item.unitPrice | number:'1.0-0' }}</td>
                <td class="text-right hide-on-production">$ {{ item.lineTotal | number:'1.0-0' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Payments (no-print for production) -->
      <div class="card section no-print-production">
        <div class="section-header">
          <h3>Pagos ({{ order.payments?.length }})</h3>
          <button *ngIf="order.status === 'ACTIVE' && order.balance > 0" class="btn btn-primary btn-sm no-print" (click)="showPaymentForm = !showPaymentForm">
            {{ showPaymentForm ? 'Cancelar' : '+ Registrar Pago' }}
          </button>
        </div>

        <!-- Payment Form -->
        <div class="form-inline no-print" *ngIf="showPaymentForm">
          <select [(ngModel)]="newPayment.paymentMethodId">
            <option value="">Medio de pago</option>
            @for (m of paymentMethods; track m.id) {
              <option [value]="m.id">{{ m.name }}</option>
            }
          </select>
          <input type="number" [(ngModel)]="newPayment.amount" [max]="order.balance" placeholder="Monto" />
          <input type="text" [(ngModel)]="newPayment.notes" placeholder="Nota (opcional)" />
          <button class="btn btn-primary btn-sm" (click)="registerPayment()" [disabled]="savingPayment">
            {{ savingPayment ? '...' : 'Guardar' }}
          </button>
        </div>

        <table class="data-table" *ngIf="order.payments?.length > 0">
          <thead>
            <tr>
              <th>Fecha</th>
              <th>Medio</th>
              <th class="text-right">Monto</th>
              <th>Nota</th>
            </tr>
          </thead>
          <tbody>
            @for (p of order.payments; track p.id) {
              <tr>
                <td>{{ p.paymentDate | date:'dd/MM/yyyy HH:mm' }}</td>
                <td>{{ p.paymentMethod?.name }}</td>
                <td class="text-right">$ {{ p.amount | number:'1.0-0' }}</td>
                <td>{{ p.notes || '—' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>

      <!-- Print Footer -->
      <div class="print-footer">
        <div class="signature-line">
          <span>Firma del cliente</span>
        </div>
        <p class="print-note">Documento generado el {{ today | date:'dd/MM/yyyy HH:mm' }}</p>
      </div>
    </div>

    <div class="loading" *ngIf="loading">
      <div class="spinner"></div>
      <p>Cargando orden...</p>
    </div>
  `,
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private orderService: OrderService,
    private paymentService: PaymentService,
    private settingsService: SettingsService,
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

  // O4/O5: Print order
  printOrder(mode: 'production' | 'customer') {
    this.printMode = mode;
    // Add/remove CSS class on body for print mode
    document.body.classList.add('printing', `print-${mode}`);
    setTimeout(() => {
      window.print();
      // Cleanup after print dialog closes
      setTimeout(() => {
        document.body.classList.remove('printing', `print-${mode}`);
        this.printMode = null;
      }, 500);
    }, 100);
  }
}
