import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report/report.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="page-header">
      <h1>Reportes</h1>
      <button class="btn btn-outline" (click)="printReport()">🖨️ Imprimir</button>
    </div>

    <!-- Tab Selector -->
    <div class="tabs no-print">
      <button class="tab" [class.active]="activeTab === 'daily'" (click)="activeTab = 'daily'; loadDaily()">Corte Diario</button>
      <button class="tab" [class.active]="activeTab === 'monthly'" (click)="activeTab = 'monthly'; loadMonthly()">Corte Mensual</button>
    </div>

    <!-- ======================= DAILY REPORT ======================= -->
    <div *ngIf="activeTab === 'daily'">
      <div class="filter-bar no-print">
        <input type="date" [(ngModel)]="dailyDate" (change)="loadDaily()" />
      </div>

      <div class="report-grid" *ngIf="dailyData">
        <!-- KPI Row -->
        <div class="kpi-row">
          <div class="kpi-card income-card">
            <span class="kpi-label">Ingresos</span>
            <span class="kpi-value">$ {{ dailyData.totalIncome | number:'1.0-0' }}</span>
          </div>
          <div class="kpi-card expense-card">
            <span class="kpi-label">Egresos</span>
            <span class="kpi-value">$ {{ dailyData.totalExpense | number:'1.0-0' }}</span>
          </div>
          <div class="kpi-card net-card">
            <span class="kpi-label">Neto</span>
            <span class="kpi-value">$ {{ dailyData.net | number:'1.0-0' }}</span>
          </div>
          <div class="kpi-card orders-card">
            <span class="kpi-label">Órdenes creadas</span>
            <span class="kpi-value">{{ dailyData.ordersCreated }}</span>
          </div>
        </div>

        <!-- D3: Daily Income by Payment Method -->
        <div class="card section" *ngIf="dailyData.incomeByMethod?.length > 0">
          <h3>Ingresos por Medio de Pago</h3>
          <table class="data-table">
            <thead><tr><th>Medio</th><th class="text-right">Transacciones</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              @for (m of dailyData.incomeByMethod; track m.method) {
                <tr>
                  <td><strong>{{ m.method }}</strong></td>
                  <td class="text-right">{{ m.count }}</td>
                  <td class="text-right text-green">$ {{ m.total | number:'1.0-0' }}</td>
                </tr>
              }
            </tbody>
            <tfoot><tr class="total-row"><td><strong>Total</strong></td><td></td><td class="text-right"><strong>$ {{ dailyData.totalIncome | number:'1.0-0' }}</strong></td></tr></tfoot>
          </table>
        </div>

        <!-- D3: Daily Expenses by Payment Method -->
        <div class="card section" *ngIf="dailyData.expensesByMethod?.length > 0">
          <h3>Egresos por Medio de Pago</h3>
          <table class="data-table">
            <thead><tr><th>Medio</th><th class="text-right">Transacciones</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              @for (m of dailyData.expensesByMethod; track m.method) {
                <tr>
                  <td><strong>{{ m.method }}</strong></td>
                  <td class="text-right">{{ m.count }}</td>
                  <td class="text-right text-red">$ {{ m.total | number:'1.0-0' }}</td>
                </tr>
              }
            </tbody>
            <tfoot><tr class="total-row"><td><strong>Total</strong></td><td></td><td class="text-right"><strong>$ {{ dailyData.totalExpense | number:'1.0-0' }}</strong></td></tr></tfoot>
          </table>
        </div>

        <!-- Payments Detail -->
        <div class="card section">
          <h3>Detalle de Pagos ({{ dailyData.payments?.length }})</h3>
          <table class="data-table">
            <thead><tr><th>Orden</th><th>Cliente</th><th>Medio</th><th class="text-right">Monto</th></tr></thead>
            <tbody>
              @for (p of dailyData.payments; track p.id) {
                <tr>
                  <td class="mono">{{ p.order?.number }}</td>
                  <td>{{ p.order?.customer?.name }}</td>
                  <td>{{ p.paymentMethod?.name }}</td>
                  <td class="text-right">$ {{ p.amount | number:'1.0-0' }}</td>
                </tr>
              }
              @if (dailyData.payments?.length === 0) {
                <tr><td colspan="4" class="empty">Sin pagos registrados</td></tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Expenses Detail -->
        <div class="card section">
          <h3>Detalle de Egresos ({{ dailyData.expenses?.length }})</h3>
          <table class="data-table">
            <thead><tr><th>#</th><th>Descripción</th><th>Categoría</th><th>Medio</th><th class="text-right">Monto</th></tr></thead>
            <tbody>
              @for (e of dailyData.expenses; track e.id) {
                <tr>
                  <td class="mono">{{ e.number }}</td>
                  <td>{{ e.description }}</td>
                  <td>{{ e.category?.name || '—' }}</td>
                  <td>{{ e.paymentMethod?.name || '—' }}</td>
                  <td class="text-right text-red">$ {{ e.amount | number:'1.0-0' }}</td>
                </tr>
              }
              @if (dailyData.expenses?.length === 0) {
                <tr><td colspan="5" class="empty">Sin egresos registrados</td></tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- ======================= MONTHLY REPORT ======================= -->
    <div *ngIf="activeTab === 'monthly'">
      <div class="filter-bar no-print">
        <select [(ngModel)]="selectedMonth" (change)="loadMonthly()">
          @for (m of months; track m.value) {
            <option [value]="m.value">{{ m.label }}</option>
          }
        </select>
        <select [(ngModel)]="selectedYear" (change)="loadMonthly()">
          @for (y of years; track y) {
            <option [value]="y">{{ y }}</option>
          }
        </select>
      </div>

      <div class="report-grid" *ngIf="monthlyData">
        <!-- KPI Row -->
        <div class="kpi-row">
          <div class="kpi-card income-card">
            <span class="kpi-label">Ingresos</span>
            <span class="kpi-value">$ {{ monthlyData.totalIncome | number:'1.0-0' }}</span>
          </div>
          <div class="kpi-card expense-card">
            <span class="kpi-label">Egresos</span>
            <span class="kpi-value">$ {{ monthlyData.totalExpenses | number:'1.0-0' }}</span>
          </div>
          <div class="kpi-card net-card">
            <span class="kpi-label">Neto</span>
            <span class="kpi-value">$ {{ monthlyData.netIncome | number:'1.0-0' }}</span>
          </div>
          <div class="kpi-card orders-card">
            <span class="kpi-label">Órdenes</span>
            <span class="kpi-value">{{ monthlyData.ordersSummary?.count }} ($ {{ monthlyData.ordersSummary?.total | number:'1.0-0' }})</span>
          </div>
        </div>

        <!-- D3: Monthly Income by Payment Method -->
        <div class="card section" *ngIf="monthlyData.byMethod?.length > 0">
          <h3>Ingresos por Medio de Pago</h3>
          <table class="data-table">
            <thead><tr><th>Medio</th><th class="text-right">Transacciones</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              @for (m of monthlyData.byMethod; track m.name) {
                <tr>
                  <td><strong>{{ m.name }}</strong></td>
                  <td class="text-right">{{ m.count }}</td>
                  <td class="text-right text-green">$ {{ m.total | number:'1.0-0' }}</td>
                </tr>
              }
            </tbody>
            <tfoot><tr class="total-row"><td><strong>Total</strong></td><td></td><td class="text-right"><strong>$ {{ monthlyData.totalIncome | number:'1.0-0' }}</strong></td></tr></tfoot>
          </table>
        </div>

        <!-- D3: Monthly Expenses by Payment Method -->
        <div class="card section" *ngIf="monthlyData.expensesByMethod?.length > 0">
          <h3>Egresos por Medio de Pago</h3>
          <table class="data-table">
            <thead><tr><th>Medio</th><th class="text-right">Transacciones</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              @for (m of monthlyData.expensesByMethod; track m.name) {
                <tr>
                  <td><strong>{{ m.name }}</strong></td>
                  <td class="text-right">{{ m.count }}</td>
                  <td class="text-right text-red">$ {{ m.total | number:'1.0-0' }}</td>
                </tr>
              }
            </tbody>
            <tfoot><tr class="total-row"><td><strong>Total</strong></td><td></td><td class="text-right"><strong>$ {{ monthlyData.totalExpenses | number:'1.0-0' }}</strong></td></tr></tfoot>
          </table>
        </div>

        <!-- Expenses by Category -->
        <div class="card section" *ngIf="monthlyData.byCategory?.length > 0">
          <h3>Egresos por Categoría</h3>
          <table class="data-table">
            <thead><tr><th>Categoría</th><th class="text-right">Cantidad</th><th class="text-right">Total</th></tr></thead>
            <tbody>
              @for (c of monthlyData.byCategory; track c.name) {
                <tr>
                  <td><strong>{{ c.name }}</strong></td>
                  <td class="text-right">{{ c.count }}</td>
                  <td class="text-right">$ {{ c.total | number:'1.0-0' }}</td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements OnInit {
  activeTab = 'daily';
  dailyDate = '';
  dailyData: any = null;
  monthlyData: any = null;

  selectedMonth = new Date().getMonth() + 1;
  selectedYear = new Date().getFullYear();

  months = [
    { value: 1, label: 'Enero' }, { value: 2, label: 'Febrero' }, { value: 3, label: 'Marzo' },
    { value: 4, label: 'Abril' }, { value: 5, label: 'Mayo' }, { value: 6, label: 'Junio' },
    { value: 7, label: 'Julio' }, { value: 8, label: 'Agosto' }, { value: 9, label: 'Septiembre' },
    { value: 10, label: 'Octubre' }, { value: 11, label: 'Noviembre' }, { value: 12, label: 'Diciembre' },
  ];

  years = [2024, 2025, 2026];

  constructor(private reportService: ReportService) { }

  ngOnInit() {
    this.dailyDate = new Date().toISOString().split('T')[0];
    this.loadDaily();
  }

  loadDaily() {
    this.reportService.getDaily(this.dailyDate).subscribe({
      next: (res: any) => { this.dailyData = res.data; },
    });
  }

  loadMonthly() {
    this.reportService.getMonthly(this.selectedYear, this.selectedMonth).subscribe({
      next: (res: any) => { this.monthlyData = res.data; },
    });
  }

  printReport() {
    window.print();
  }
}
