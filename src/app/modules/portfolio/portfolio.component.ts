import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../core/services/report/report.service';
import { CustomerService } from '../../core/services/customer/customer.service';

@Component({
  selector: 'app-portfolio',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="page-header">
      <h1>Cartera</h1>
      <button class="btn btn-outline" (click)="printPortfolio()">🖨️ Imprimir</button>
    </div>

    <!-- Filters (CA1) -->
    <div class="filters">
      <div class="form-group filter-customer">
        <input type="text" [(ngModel)]="customerSearch" (input)="searchCustomers()" placeholder="🔍 Filtrar por cliente..." />
        <div class="dropdown" *ngIf="customerResults.length > 0">
          @for (c of customerResults; track c.id) {
            <div class="dropdown-item" (click)="selectCustomer(c)">
              <strong>{{ c.name }}</strong> <span>{{ c.identification }}</span>
            </div>
          }
        </div>
      </div>
      <select [(ngModel)]="statusFilter" (change)="onFilter()">
        <option value="">Activas (por defecto)</option>
        <option value="ACTIVE">Activas</option>
        <option value="COMPLETED">Completadas</option>
        <option value="CANCELLED">Anuladas</option>
      </select>
    </div>

    <div class="filters date-filters">
      <div class="date-group">
        <label>Desde</label>
        <input type="date" [(ngModel)]="dateFrom" (change)="onFilter()" />
      </div>
      <div class="date-group">
        <label>Hasta</label>
        <input type="date" [(ngModel)]="dateTo" (change)="onFilter()" />
      </div>
      <button class="btn btn-outline btn-sm" *ngIf="dateFrom || dateTo || selectedCustomer" (click)="clearFilters()">✕ Limpiar filtros</button>
    </div>

    <!-- Selected customer tag -->
    <div class="active-filter" *ngIf="selectedCustomer">
      <span>Cliente: <strong>{{ selectedCustomer.name }}</strong></span>
      <button class="tag-remove" (click)="clearCustomer()">×</button>
    </div>

    <!-- Summary -->
    <div class="summary-bar" *ngIf="totalDebt > 0">
      <div class="summary-left">
        <span>Total cartera pendiente:</span>
        <strong>$ {{ totalDebt | number:'1.0-0' }}</strong>
      </div>
      <span class="summary-count">{{ orders.length }} {{ orders.length === 1 ? 'orden' : 'órdenes' }}</span>
    </div>

    <!-- Table -->
    <div class="card" id="portfolio-print-area">
      <div class="print-header">
        <h2>Reporte de Cartera</h2>
        <p>Generado: {{ today | date:'dd/MM/yyyy HH:mm' }}</p>
        <p *ngIf="selectedCustomer">Cliente: {{ selectedCustomer.name }} ({{ selectedCustomer.identification }})</p>
        <p *ngIf="dateFrom || dateTo">Período: {{ dateFrom || '...' }} — {{ dateTo || '...' }}</p>
      </div>

      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Vendedor</th>
            <th>Vencimiento</th>
            <th class="text-right">Total</th>
            <th class="text-right">Saldo</th>
            <th>Estado</th>
            <th class="no-print">Días</th>
          </tr>
        </thead>
        <tbody>
          @for (o of orders; track o.id) {
            <tr [class.overdue]="o.daysOverdue > 0">
              <td class="mono">{{ o.number }}</td>
              <td><strong>{{ o.customer?.name }}</strong></td>
              <td>{{ o.orderDate | date:'dd/MM/yyyy' }}</td>
              <td class="text-muted">{{ o.sellerName }}</td>
              <td>{{ o.dueDate ? (o.dueDate | date:'dd/MM/yyyy') : '—' }}</td>
              <td class="text-right">$ {{ o.total | number:'1.0-0' }}</td>
              <td class="text-right debt">$ {{ o.balance | number:'1.0-0' }}</td>
              <td><span class="badge status-{{ o.status }}">{{ o.status }}</span></td>
              <td class="no-print">
                <span class="badge" [class.overdue-badge]="o.daysOverdue > 0" [class.ok-badge]="o.daysOverdue <= 0">
                  {{ o.daysOverdue > 0 ? o.daysOverdue + ' vencidos' : 'Al día' }}
                </span>
              </td>
            </tr>
          }
          @if (orders.length === 0 && !loading) {
            <tr><td colspan="9" class="empty">Sin cartera pendiente 🎉</td></tr>
          }
        </tbody>
        <tfoot *ngIf="orders.length > 0">
          <tr class="total-row">
            <td colspan="5"></td>
            <td class="text-right"><strong>Total:</strong></td>
            <td class="text-right debt"><strong>$ {{ totalDebt | number:'1.0-0' }}</strong></td>
            <td colspan="2"></td>
          </tr>
        </tfoot>
      </table>
    </div>
  `,
  styleUrl: './portfolio.component.scss',
})
export class PortfolioComponent implements OnInit {
  orders: any[] = [];
  totalDebt = 0;
  loading = true;
  today = new Date();

  // CA1: Filters
  customerSearch = '';
  customerResults: any[] = [];
  selectedCustomer: any = null;
  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  searchTimeout: any;

  constructor(
    private reportService: ReportService,
    private customerService: CustomerService,
  ) { }

  ngOnInit() { this.loadPortfolio(); }

  loadPortfolio() {
    this.loading = true;
    this.reportService.getPortfolio({
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      customerId: this.selectedCustomer?.id,
      status: this.statusFilter,
    }).subscribe({
      next: (res: any) => {
        this.orders = res.data;
        this.totalDebt = res.totalBalance || 0;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  // Customer autocomplete
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
    this.loadPortfolio();
  }

  clearCustomer() {
    this.selectedCustomer = null;
    this.loadPortfolio();
  }

  onFilter() {
    this.loadPortfolio();
  }

  clearFilters() {
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedCustomer = null;
    this.statusFilter = '';
    this.loadPortfolio();
  }

  // CA2: Print
  printPortfolio() {
    window.print();
  }
}
