import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { CustomerService } from '../../core/services/customer/customer.service';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
  selector: 'app-customers',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './customers.component.html',
  styleUrl: './customers.component.scss',
})
export class CustomersComponent implements OnInit {
  customers: any[] = [];
  total = 0;
  page = 1;
  limit = 20;
  searchTerm = '';
  loading = true;
  showForm = false;
  saving = false;
  searchTimeout: any;

  newCustomer = { identification: '', name: '', phone: '', email: '', address: '' };

  get totalPages() { return Math.ceil(this.total / this.limit); }

  constructor(private customerService: CustomerService, private toast: ToastService) { }

  ngOnInit() { this.loadCustomers(); }

  loadCustomers() {
    this.loading = true;
    this.customerService.list({ page: this.page, limit: this.limit, search: this.searchTerm }).subscribe({
      next: (res: any) => {
        this.customers = res.data;
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
      this.loadCustomers();
    }, 400);
  }

  changePage(p: number) {
    this.page = p;
    this.loadCustomers();
  }

  createCustomer() {
    if (!this.newCustomer.identification || !this.newCustomer.name) return;

    const phone = this.newCustomer.phone?.trim();
    if (phone && !/^3\d{9}$/.test(phone)) {
      this.toast.error('Error', 'El teléfono debe tener 10 dígitos, empezar por 3 y no contener espacios');
      return;
    }

    this.saving = true;
    this.customerService.create(this.newCustomer).subscribe({
      next: () => {
        this.saving = false;
        this.showForm = false;
        this.newCustomer = { identification: '', name: '', phone: '', email: '', address: '' };
        this.loadCustomers();
      },
      error: (err: any) => {
        this.saving = false;
        this.toast.error('Error', err.error?.error || 'Error al crear cliente');
      },
    });
  }
}
