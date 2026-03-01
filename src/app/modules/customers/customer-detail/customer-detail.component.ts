import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { CustomerService } from '../../../core/services/customer/customer.service';

@Component({
  selector: 'app-customer-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customer-detail.component.html',
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
  operationalFilter = '';
  dateFrom = '';
  dateTo = '';

  // Edit customer
  editingCustomer = false;
  savingCustomer = false;
  editData: any = {};

  operationalLabels: any = {
    PENDING: 'Pendiente',
    APPROVED: 'Aprobada',
    IN_PRODUCTION: 'En Producción',
    PRODUCED: 'Producida',
    DELIVERED: 'Entregada',
  };

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
      operationalStatus: this.operationalFilter,
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
    this.operationalFilter = '';
    this.onFilter();
  }

  changePage(p: number) {
    this.orderPage = p;
    this.loadingOrders = true;
    this.loadCustomer(this.customer.id);
  }

  // Edit customer
  toggleEdit() {
    this.editingCustomer = !this.editingCustomer;
    if (this.editingCustomer) {
      this.editData = {
        name: this.customer.name || '',
        phone: this.customer.phone || '',
        email: this.customer.email || '',
        address: this.customer.address || '',
        notes: this.customer.notes || '',
        isActive: this.customer.isActive !== false,
      };
    }
  }

  saveCustomerEdit() {
    if (!this.editData.name?.trim()) return;
    this.savingCustomer = true;
    this.customerService.update(this.customer.id, this.editData).subscribe({
      next: (res: any) => {
        // Merge updated fields into customer
        Object.assign(this.customer, res.data);
        this.savingCustomer = false;
        this.editingCustomer = false;
      },
      error: () => { this.savingCustomer = false; },
    });
  }

  deleteCustomer() {
    if (!confirm(`¿Eliminar al cliente "${this.customer.name}"? Esta acción no se puede deshacer.`)) return;
    this.customerService.delete(this.customer.id).subscribe({
      next: () => { this.router.navigate(['/customers']); },
      error: (err: any) => {
        alert(err.error?.error || 'Error al eliminar cliente');
      },
    });
  }
}
