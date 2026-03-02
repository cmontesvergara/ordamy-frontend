import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../core/services/report/report.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';

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

  constructor(private reportService: ReportService, public config: AppConfigService) { }

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
