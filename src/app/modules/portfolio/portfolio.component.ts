import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report/report.service';

@Component({
    selector: 'app-portfolio',
    standalone: true,
    imports: [CommonModule],
    template: `
    <div class="page-header"><h1>Cartera</h1></div>

    <div class="summary-bar" *ngIf="totalDebt > 0">
      <span>Total cartera pendiente:</span>
      <strong>$ {{ totalDebt | number:'1.0-0' }}</strong>
    </div>

    <div class="card">
      <table class="data-table">
        <thead>
          <tr>
            <th>#</th>
            <th>Cliente</th>
            <th>Fecha</th>
            <th>Vencimiento</th>
            <th class="text-right">Total</th>
            <th class="text-right">Saldo</th>
            <th>Días</th>
          </tr>
        </thead>
        <tbody>
          @for (o of orders; track o.id) {
            <tr [class.overdue]="o.daysOverdue > 0">
              <td class="mono">{{ o.number }}</td>
              <td><strong>{{ o.customer?.name }}</strong></td>
              <td>{{ o.orderDate | date:'dd/MM/yyyy' }}</td>
              <td>{{ o.dueDate ? (o.dueDate | date:'dd/MM/yyyy') : '—' }}</td>
              <td class="text-right">$ {{ o.total | number:'1.0-0' }}</td>
              <td class="text-right debt">$ {{ o.balance | number:'1.0-0' }}</td>
              <td>
                <span class="badge" [class.overdue-badge]="o.daysOverdue > 0" [class.ok-badge]="o.daysOverdue <= 0">
                  {{ o.daysOverdue > 0 ? o.daysOverdue + ' vencidos' : 'Al día' }}
                </span>
              </td>
            </tr>
          }
          @if (orders.length === 0 && !loading) {
            <tr><td colspan="7" class="empty">Sin cartera pendiente 🎉</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
    styleUrl: './portfolio.component.scss',
})
export class PortfolioComponent implements OnInit {
    orders: any[] = [];
    totalDebt = 0;
    loading = true;

    constructor(private reportService: ReportService) { }

    ngOnInit() {
        this.reportService.getPortfolio().subscribe({
            next: (res: any) => {
                this.orders = res.data;
                this.totalDebt = this.orders.reduce((sum: number, o: any) => sum + (o.balance || 0), 0);
                this.loading = false;
            },
            error: () => { this.loading = false; },
        });
    }
}
