import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report/report.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './reports.component.html',
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

  constructor(
    private reportService: ReportService,
    public config: AppConfigService,
    private toast: ToastService
  ) { }

  ngOnInit() {
    const d = new Date();
    this.dailyDate = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
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
    const isDaily = this.activeTab === 'daily';
    const message = isDaily ? 'Descargando Corte Diario...' : 'Descargando Corte Mensual...';

    this.toast.show('info', 'Generando', message);

    const request$ = isDaily
      ? this.reportService.downloadDailyPdf(this.dailyDate)
      : this.reportService.downloadMonthlyPdf(this.selectedYear, this.selectedMonth);

    request$.subscribe({
      next: (blob: Blob) => {
        const fileURL = URL.createObjectURL(blob);
        window.open(fileURL, '_blank');
      },
      error: () => this.toast.error('Error', 'No se pudo generar el PDF')
    });
  }
}
