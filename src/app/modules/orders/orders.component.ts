import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order/order.service';

@Component({
  selector: 'app-orders',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1>Órdenes</h1>
      <a routerLink="/orders/new" class="btn btn-primary">+ Nueva Orden</a>
    </div>

    <!-- Filters -->
    <div class="filters">
      <input type="text" [(ngModel)]="search" (input)="onSearch()" placeholder="🔍 Buscar por # o cliente..." class="search-input" />
      <select [(ngModel)]="statusFilter" (change)="onFilter()">
        <option value="">Todos los estados</option>
        <option value="ACTIVE">Activas</option>
        <option value="COMPLETED">Completadas</option>
        <option value="CANCELLED">Anuladas</option>
      </select>
    </div>

    <!-- Date Range Filter -->
    <div class="filters date-filters">
      <div class="date-group">
        <label>Desde</label>
        <input type="date" [(ngModel)]="dateFrom" (change)="onFilter()" />
      </div>
      <div class="date-group">
        <label>Hasta</label>
        <input type="date" [(ngModel)]="dateTo" (change)="onFilter()" />
      </div>
      <button class="btn btn-outline btn-sm" *ngIf="dateFrom || dateTo" (click)="clearDates()">✕ Limpiar fechas</button>
    </div>

    <!-- Table -->
    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Vendedor</th>
            <th class="text-right">Total</th>
            <th class="text-right">Saldo</th>
            <th>Estado</th>
            <th>Operativo</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          @for (o of orders; track o.id) {
            <tr class="clickable" [routerLink]="['/orders', o.id]">
              <td class="mono">{{ o.number }}</td>
              <td><strong>{{ o.customer?.name }}</strong></td>
              <td>{{ o.orderDate | date:'dd/MM/yyyy' }}</td>
              <td class="text-muted">{{ o.sellerName }}</td>
              <td class="text-right">$ {{ o.total | number:'1.0-0' }}</td>
              <td class="text-right" [class.debt]="o.balance > 0">$ {{ o.balance | number:'1.0-0' }}</td>
              <td><span class="badge status-{{ o.status }}">{{ o.status }}</span></td>
              <td><span class="badge op-{{ o.operationalStatus }}">{{ operationalLabels[o.operationalStatus] || '—' }}</span></td>
              <td>{{ o._count?.items || 0 }}</td>
            </tr>
          }
          @if (orders.length === 0 && !loading) {
            <tr><td colspan="9" class="empty">No se encontraron órdenes</td></tr>
          }
        </tbody>
      </table>

      <div class="pagination" *ngIf="total > limit">
        <button class="btn btn-sm" [disabled]="page <= 1" (click)="changePage(page - 1)">← Anterior</button>
        <span>Página {{ page }} de {{ totalPages }} ({{ total }} resultados)</span>
        <button class="btn btn-sm" [disabled]="page >= totalPages" (click)="changePage(page + 1)">Siguiente →</button>
      </div>
    </div>

    <!-- Cancel Confirmation Modal -->
    <div class="modal-overlay" *ngIf="showCancelModal" (click)="showCancelModal = false">
      <div class="modal-content" (click)="$event.stopPropagation()">
        <h3>Anular Orden #{{ cancelTarget?.number }}</h3>
        <p>Esta acción no se puede deshacer. Ingresa el motivo de anulación:</p>
        <textarea [(ngModel)]="cancelReason" rows="3" placeholder="Motivo de anulación..."></textarea>
        <div class="modal-actions">
          <button class="btn btn-outline" (click)="showCancelModal = false">Cancelar</button>
          <button class="btn btn-danger" (click)="confirmCancel()" [disabled]="!cancelReason.trim()">Confirmar Anulación</button>
        </div>
      </div>
    </div>
  `,
  styleUrl: './orders.component.scss',
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  total = 0;
  page = 1;
  limit = 20;
  search = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  loading = true;
  searchTimeout: any;
  openMenuId: string | null = null;

  // Cancel modal
  showCancelModal = false;
  cancelTarget: any = null;
  cancelReason = '';

  operationalLabels: any = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    IN_PRODUCTION: 'En Producción',
    PRODUCED: 'Producida',
    DELIVERED: 'Entregada',
  };

  get totalPages() { return Math.ceil(this.total / this.limit); }

  constructor(
    private orderService: OrderService,
    private router: Router,
  ) {
    // Close menu on outside click
    document.addEventListener('click', () => { this.openMenuId = null; });
  }

  ngOnInit() { this.loadOrders(); }

  loadOrders() {
    this.loading = true;
    this.orderService.list({
      page: this.page,
      limit: this.limit,
      search: this.search,
      status: this.statusFilter,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
    }).subscribe({
      next: (res: any) => {
        this.orders = res.data;
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
      this.loadOrders();
    }, 400);
  }

  onFilter() {
    this.page = 1;
    this.loadOrders();
  }

  clearDates() {
    this.dateFrom = '';
    this.dateTo = '';
    this.onFilter();
  }

  changePage(p: number) {
    this.page = p;
    this.loadOrders();
  }

  // Actions menu
  toggleMenu(id: string, event: Event) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  goToDetail(id: string) {
    this.openMenuId = null;
    this.router.navigate(['/orders', id]);
  }

  cancelOrder(order: any) {
    this.openMenuId = null;
    this.cancelTarget = order;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  confirmCancel() {
    if (!this.cancelTarget || !this.cancelReason.trim()) return;
    this.orderService.cancel(this.cancelTarget.id, this.cancelReason).subscribe({
      next: () => {
        this.showCancelModal = false;
        this.loadOrders();
      },
    });
  }
}
