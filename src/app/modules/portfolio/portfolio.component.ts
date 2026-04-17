import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ReportService } from '../../core/services/report/report.service';
import { CustomerService } from '../../core/services/customer/customer.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';

@Component({
    selector: 'app-portfolio',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './portfolio.component.html',
    styleUrl: './portfolio.component.scss'
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

  // Pagination
  page = 1;
  limit = 20;
  totalPages = 1;
  totalOrders = 0;

  constructor(
    private reportService: ReportService,
    private customerService: CustomerService,
    public config: AppConfigService,
  ) { }

  ngOnInit() { this.loadPortfolio(); }

  loadPortfolio() {
    this.loading = true;
    this.reportService.getPortfolio({
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
      customerId: this.selectedCustomer?.id,
      status: this.statusFilter,
      page: this.page,
      limit: this.limit
    }).subscribe({
      next: (res: any) => {
        this.orders = res.data;
        this.totalDebt = res.totalBalance || 0;
        this.totalOrders = res.count || 0;
        this.totalPages = res.pages || 1;
        this.page = res.page || 1;
        this.loading = false;
      },
      error: () => { this.loading = false; },
    });
  }

  nextPage() {
    if (this.page < this.totalPages) {
      this.page++;
      this.loadPortfolio();
    }
  }

  prevPage() {
    if (this.page > 1) {
      this.page--;
      this.loadPortfolio();
    }
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
    this.page = 1;
    this.loadPortfolio();
  }

  clearFilters() {
    this.dateFrom = '';
    this.dateTo = '';
    this.selectedCustomer = null;
    this.statusFilter = '';
    this.page = 1;
    this.loadPortfolio();
  }

  // CA2: Print
  printPortfolio() {
    window.print();
  }
}
