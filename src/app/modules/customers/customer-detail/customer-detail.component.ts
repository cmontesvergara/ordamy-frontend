import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../core/services/customer/customer.service';

@Component({
    selector: 'app-customer-detail',
    standalone: true,
    imports: [CommonModule, FormsModule, RouterLink],
    template: `
    <div *ngIf="customer" class="detail-page">
      <div class="page-header">
        <div>
          <h1>{{ customer.name }}</h1>
          <span class="sub-id">{{ customer.identification }}</span>
        </div>
        <a routerLink="/customers" class="btn btn-outline">← Volver</a>
      </div>

      <!-- Customer Info -->
      <div class="info-grid">
        <div class="info-card">
          <h4>Contacto</h4>
          <p class="sub" *ngIf="customer.phone">📞 {{ customer.phone }}</p>
          <p class="sub" *ngIf="customer.email">📧 {{ customer.email }}</p>
          <p class="sub" *ngIf="customer.address">📍 {{ customer.address }}</p>
          <p class="sub" *ngIf="!customer.phone && !customer.email && !customer.address">Sin datos de contacto</p>
        </div>

        <!-- C2: Stats Widgets -->
        <div class="info-card stat-card">
          <h4>Historial</h4>
          <div class="stat-row">
            <span>Total órdenes</span>
            <strong>{{ customer.stats?.totalOrders || 0 }}</strong>
          </div>
          <div class="stat-row">
            <span>Total facturado</span>
            <strong class="text-green">$ {{ customer.stats?.totalSpent | number:'1.0-0' }}</strong>
          </div>
        </div>
        <div class="info-card stat-card" [class.has-debt]="customer.stats?.totalDebt > 0">
          <h4>Deuda</h4>
          <div class="stat-row">
            <span>Saldo pendiente</span>
            <strong class="text-red">$ {{ customer.stats?.totalDebt | number:'1.0-0' }}</strong>
          </div>
          <div class="stat-row">
            <span>Órdenes con saldo</span>
            <strong>{{ customer.stats?.activeDebtOrders || 0 }}</strong>
          </div>
        </div>
      </div>

      <!-- C1: Order History with Filters -->
      <div class="card section">
        <h3>Órdenes</h3>

        <div class="filters">
          <select [(ngModel)]="statusFilter" (change)="onFilter()">
            <option value="">Todos los estados</option>
            <option value="ACTIVE">Activas</option>
            <option value="COMPLETED">Completadas</option>
            <option value="CANCELLED">Anuladas</option>
          </select>
          <div class="date-group">
            <label>Desde</label>
            <input type="date" [(ngModel)]="dateFrom" (change)="onFilter()" />
          </div>
          <div class="date-group">
            <label>Hasta</label>
            <input type="date" [(ngModel)]="dateTo" (change)="onFilter()" />
          </div>
          <button class="btn btn-outline btn-sm" *ngIf="dateFrom || dateTo || statusFilter" (click)="clearFilters()">✕ Limpiar</button>
        </div>

        <table class="data-table">
          <thead>
            <tr>
              <th>#</th>
              <th>Fecha</th>
              <th>Vendedor</th>
              <th class="text-right">Total</th>
              <th class="text-right">Saldo</th>
              <th>Estado</th>
            </tr>
          </thead>
          <tbody>
            @for (o of orders; track o.id) {
              <tr class="clickable" [routerLink]="['/orders', o.id]">
                <td class="mono">{{ o.number }}</td>
                <td>{{ o.orderDate | date:'dd/MM/yyyy' }}</td>
                <td class="text-muted">{{ o.sellerName }}</td>
                <td class="text-right">$ {{ o.total | number:'1.0-0' }}</td>
                <td class="text-right" [class.debt]="o.balance > 0">$ {{ o.balance | number:'1.0-0' }}</td>
                <td><span class="badge status-{{ o.status }}">{{ o.status }}</span></td>
              </tr>
            }
            @if (orders.length === 0 && !loadingOrders) {
              <tr><td colspan="6" class="empty">No se encontraron órdenes</td></tr>
            }
          </tbody>
        </table>

        <div class="pagination" *ngIf="orderTotal > orderLimit">
          <button class="btn btn-sm" [disabled]="orderPage <= 1" (click)="changePage(orderPage - 1)">← Anterior</button>
          <span>Pág. {{ orderPage }} de {{ totalOrderPages }} ({{ orderTotal }} resultados)</span>
          <button class="btn btn-sm" [disabled]="orderPage >= totalOrderPages" (click)="changePage(orderPage + 1)">Siguiente →</button>
        </div>
      </div>
    </div>

    <div class="loading" *ngIf="loading">
      <div class="spinner"></div>
      <p>Cargando cliente...</p>
    </div>
  `,
    styleUrl: './customer-detail.component.scss',
})
export class CustomerDetailComponent implements OnInit {
    customer: any = null;
    orders: any[] = [];
    orderTotal = 0;
    orderPage = 1;
    orderLimit = 20;
    loading = true;
    loadingOrders = false;
    statusFilter = '';
    dateFrom = '';
    dateTo = '';

    get totalOrderPages() { return Math.ceil(this.orderTotal / this.orderLimit); }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private customerService: CustomerService,
    ) { }

    ngOnInit() {
        const id = this.route.snapshot.paramMap.get('id')!;
        this.loadCustomer(id);
    }

    loadCustomer(id: string) {
        this.loading = true;
        this.customerService.get(id, {
            dateFrom: this.dateFrom,
            dateTo: this.dateTo,
            status: this.statusFilter,
            page: this.orderPage,
            limit: this.orderLimit,
        }).subscribe({
            next: (res: any) => {
                this.customer = res.data;
                this.orders = res.data.orders || [];
                this.orderTotal = res.data.orderTotal || 0;
                this.loading = false;
                this.loadingOrders = false;
            },
            error: () => { this.loading = false; this.loadingOrders = false; },
        });
    }

    onFilter() {
        this.orderPage = 1;
        this.loadingOrders = true;
        this.loadCustomer(this.customer.id);
    }

    clearFilters() {
        this.dateFrom = '';
        this.dateTo = '';
        this.statusFilter = '';
        this.onFilter();
    }

    changePage(p: number) {
        this.orderPage = p;
        this.loadingOrders = true;
        this.loadCustomer(this.customer.id);
    }
}
