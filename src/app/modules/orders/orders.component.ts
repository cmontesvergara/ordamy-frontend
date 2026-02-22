import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
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

    <!-- Table -->
    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th class="text-right">Total</th>
            <th class="text-right">Saldo</th>
            <th>Estado</th>
            <th>Items</th>
          </tr>
        </thead>
        <tbody>
          @for (o of orders; track o.id) {
            <tr class="clickable" [routerLink]="['/orders', o.id]">
              <td class="mono">{{ o.number }}</td>
              <td><strong>{{ o.customer?.name }}</strong></td>
              <td>{{ o.orderDate | date:'dd/MM/yyyy' }}</td>
              <td class="text-right">$ {{ o.total | number:'1.0-0' }}</td>
              <td class="text-right" [class.debt]="o.balance > 0">$ {{ o.balance | number:'1.0-0' }}</td>
              <td><span class="badge status-{{ o.status }}">{{ o.status }}</span></td>
              <td>{{ o._count?.items || 0 }}</td>
            </tr>
          }
          @if (orders.length === 0 && !loading) {
            <tr><td colspan="7" class="empty">No se encontraron órdenes</td></tr>
          }
        </tbody>
      </table>

      <div class="pagination" *ngIf="total > limit">
        <button class="btn btn-sm" [disabled]="page <= 1" (click)="changePage(page - 1)">← Anterior</button>
        <span>Página {{ page }} de {{ totalPages }}</span>
        <button class="btn btn-sm" [disabled]="page >= totalPages" (click)="changePage(page + 1)">Siguiente →</button>
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
  loading = true;
  searchTimeout: any;

  get totalPages() { return Math.ceil(this.total / this.limit); }

  constructor(private orderService: OrderService) { }

  ngOnInit() { this.loadOrders(); }

  loadOrders() {
    this.loading = true;
    this.orderService.list({
      page: this.page,
      limit: this.limit,
      search: this.search,
      status: this.statusFilter,
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

  changePage(p: number) {
    this.page = p;
    this.loadOrders();
  }
}
