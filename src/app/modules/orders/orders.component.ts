import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { OrderService } from '../../core/services/order/order.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';

@Component({
    selector: 'app-orders',
    imports: [CommonModule, FormsModule, RouterLink],
    templateUrl: './orders.component.html',
    styleUrl: './orders.component.scss'
})
export class OrdersComponent implements OnInit {
  orders: any[] = [];
  total = 0;
  page = 1;
  limit = 20;
  search = '';
  statusFilter = '';
  dateFrom = '';
  dateTo = '';
  loading = true;
  searchTimeout: any;
  openMenuId: string | null = null;

  // Cancel modal
  showCancelModal = false;
  cancelTarget: any = null;
  cancelReason = '';

  operationalLabels: any = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    IN_PRODUCTION: 'En Producción',
    PRODUCED: 'Producida',
    DELIVERED: 'Entregada',
  };

  get totalPages() { return Math.ceil(this.total / this.limit); }

  constructor(
    private orderService: OrderService,
    private router: Router,
    public config: AppConfigService,
  ) {
    // Close menu on outside click
    document.addEventListener('click', () => { this.openMenuId = null; });
  }

  ngOnInit() { this.loadOrders(); }

  loadOrders() {
    this.loading = true;
    this.orderService.list({
      page: this.page,
      limit: this.limit,
      search: this.search,
      status: this.statusFilter,
      dateFrom: this.dateFrom,
      dateTo: this.dateTo,
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

  clearDates() {
    this.dateFrom = '';
    this.dateTo = '';
    this.onFilter();
  }

  changePage(p: number) {
    this.page = p;
    this.loadOrders();
  }

  // Actions menu
  toggleMenu(id: string, event: Event) {
    event.stopPropagation();
    this.openMenuId = this.openMenuId === id ? null : id;
  }

  goToDetail(id: string) {
    this.openMenuId = null;
    this.router.navigate(['/orders', id]);
  }

  cancelOrder(order: any) {
    this.openMenuId = null;
    this.cancelTarget = order;
    this.cancelReason = '';
    this.showCancelModal = true;
  }

  confirmCancel() {
    if (!this.cancelTarget || !this.cancelReason.trim()) return;
    this.orderService.cancel(this.cancelTarget.id, this.cancelReason).subscribe({
      next: () => {
        this.showCancelModal = false;
        this.loadOrders();
      },
    });
  }
}
