import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportService } from '../../core/services/report/report.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';

@Component({
    selector: 'app-dashboard',
    imports: [CommonModule],
    templateUrl: './dashboard.component.html',
    styleUrl: './dashboard.component.scss'
})
export class DashboardComponent implements OnInit {
  data: any = null;

  operationalSteps = [
    { key: 'PENDING', label: 'Pendiente' },
    { key: 'APPROVED', label: 'Aprobada' },
    { key: 'IN_PRODUCTION', label: 'En Producción' },
    { key: 'PRODUCED', label: 'Producida' },
    { key: 'DELIVERED', label: 'Entregada' },
  ];

  constructor(private reportService: ReportService, public config: AppConfigService) { }

  ngOnInit() {
    this.reportService.getDashboard().subscribe({
      next: (res: any) => { this.data = res.data; },
    });
  }

  get accountsTotal(): number {
    if (!this.data?.accounts) return 0;
    return this.data.accounts.reduce((sum: number, a: any) => sum + Number(a.balance || 0), 0);
  }

  getOpCount(status: string): number {
    if (!this.data?.ordersByOperationalStatus) return 0;
    const found = this.data.ordersByOperationalStatus.find((o: any) => o.status === status);
    return found?.count || 0;
  }
}
