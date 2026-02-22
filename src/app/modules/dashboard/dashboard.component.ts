import { Component, OnInit } from '@angular/core';
import { CommonModule, CurrencyPipe, DecimalPipe } from '@angular/common';
import { ReportService } from '../../core/services/report/report.service';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="dashboard-grid" *ngIf="data">
      <!-- KPI Cards -->
      <div class="kpi-card sales">
        <div class="kpi-icon">💰</div>
        <div class="kpi-info">
          <span class="kpi-label">Ventas del mes</span>
          <span class="kpi-value">\$ {{ data.salesThisMonth | number:'1.0-0' }}</span>
        </div>
      </div>

      <div class="kpi-card expenses">
        <div class="kpi-icon">💸</div>
        <div class="kpi-info">
          <span class="kpi-label">Egresos del mes</span>
          <span class="kpi-value">\$ {{ data.expensesThisMonth | number:'1.0-0' }}</span>
        </div>
      </div>

      <div class="kpi-card orders">
        <div class="kpi-icon">📋</div>
        <div class="kpi-info">
          <span class="kpi-label">Órdenes activas</span>
          <span class="kpi-value">{{ data.activeOrders }}</span>
        </div>
      </div>

      <div class="kpi-card portfolio">
        <div class="kpi-icon">📊</div>
        <div class="kpi-info">
          <span class="kpi-label">Cartera</span>
          <span class="kpi-value">\$ {{ data.portfolioBalance | number:'1.0-0' }}</span>
        </div>
      </div>

      <!-- Accounts Table -->
      <div class="card accounts-card">
        <h3>Cuentas</h3>
        <table class="data-table">
          <thead>
            <tr>
              <th>Medio de pago</th>
              <th class="text-right">Saldo</th>
            </tr>
          </thead>
          <tbody>
            @for (account of data.accounts; track account.id) {
              <tr>
                <td>{{ account.name }}</td>
                <td class="text-right">\$ {{ account.balance | number:'1.0-0' }}</td>
              </tr>
            }
          </tbody>
        </table>
      </div>
    </div>

    <div class="loading" *ngIf="loading">
      <div class="spinner"></div>
      <p>Cargando dashboard...</p>
    </div>
  `,
  styles: [`
    .dashboard-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
      gap: 1.25rem;
    }
    .kpi-card {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1.25rem;
      background: var(--card-bg, #fff);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
      box-shadow: 0 1px 3px rgba(0,0,0,0.06);
      transition: transform 0.2s, box-shadow 0.2s;
    }
    .kpi-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0,0,0,0.1);
    }
    .kpi-icon { font-size: 2rem; }
    .kpi-info { display: flex; flex-direction: column; }
    .kpi-label {
      font-size: 0.8rem;
      color: var(--text-secondary, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .kpi-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--text-primary, #1e293b);
    }
    .sales { border-left: 4px solid #22c55e; }
    .expenses { border-left: 4px solid #ef4444; }
    .orders { border-left: 4px solid #6366f1; }
    .portfolio { border-left: 4px solid #f59e0b; }

    .accounts-card {
      grid-column: 1 / -1;
      padding: 1.25rem;
      background: var(--card-bg, #fff);
      border-radius: 12px;
      border: 1px solid var(--border-color, #e2e8f0);
    }
    .accounts-card h3 {
      margin: 0 0 1rem;
      font-size: 1rem;
      color: var(--text-primary, #1e293b);
    }
    .data-table {
      width: 100%;
      border-collapse: collapse;
    }
    .data-table th, .data-table td {
      padding: 0.625rem 0.75rem;
      text-align: left;
      border-bottom: 1px solid var(--border-color, #e2e8f0);
      font-size: 0.875rem;
    }
    .data-table th {
      color: var(--text-secondary, #64748b);
      font-weight: 600;
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .text-right { text-align: right; }

    .loading {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 3rem;
      color: #64748b;
    }
    .spinner {
      width: 32px; height: 32px;
      border: 3px solid #e0e0e0;
      border-top-color: #6366f1;
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    @keyframes spin { to { transform: rotate(360deg); } }
  `],
})
export class DashboardComponent implements OnInit {
  data: any = null;
  loading = true;

  constructor(private reportService: ReportService) { }

  ngOnInit() {
    this.reportService.getDashboard().subscribe({
      next: (res: any) => {
        this.data = res.data;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }
}
