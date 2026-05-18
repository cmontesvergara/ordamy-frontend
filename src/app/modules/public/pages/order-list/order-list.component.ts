import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  PublicOrderService,
  PublicOrderSummary,
  PublicTenantInfo
} from '../../../../core/services/public/public-order.service';

const OP_META: Record<string, { label: string; bgClass: string; textClass: string }> = {
  PENDING:       { label: 'Recibida',          bgClass: 'bg-muted',          textClass: 'text-muted-foreground' },
  APPROVED:      { label: 'Aprobada',          bgClass: 'bg-blue-100',       textClass: 'text-blue-700' },
  IN_PRODUCTION: { label: 'En producción',     bgClass: 'bg-indigo-100',     textClass: 'text-indigo-700' },
  PRODUCED:      { label: 'Lista para entrega',bgClass: 'bg-emerald-100',    textClass: 'text-emerald-700' },
  DELIVERED:     { label: 'Entregada',         bgClass: 'bg-emerald-100',    textClass: 'text-emerald-700' },
  CANCELLED:     { label: 'Anulada',           bgClass: 'bg-destructive/10', textClass: 'text-destructive' },
};

@Component({
  selector: 'app-order-list',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-list.component.html',
  styleUrls: ['../../_tracker.scss']
})
export class OrderListComponent implements OnInit {
  tenantSlug = '';
  customerName = '';
  tenantInfo: PublicTenantInfo | null = null;
  orders: PublicOrderSummary[] = [];
  paginatedOrders: PublicOrderSummary[] = [];
  
  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;

  loading = true;
  sessionMissing = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicOrderService: PublicOrderService
  ) {}

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') || '';
    const phone = sessionStorage.getItem(`tracker_phone_${this.tenantSlug}`);
    const document = sessionStorage.getItem(`tracker_document_${this.tenantSlug}`);
    const tenantRaw = sessionStorage.getItem(`tracker_tenant_${this.tenantSlug}`);

    if (!phone && !document) {
      this.loading = false;
      this.sessionMissing = true;
      return;
    }

    this.customerName = sessionStorage.getItem(`tracker_customer_${this.tenantSlug}`) || '';
    if (tenantRaw) {
      try { this.tenantInfo = JSON.parse(tenantRaw); } catch {}
    }

    this.publicOrderService.getCustomerOrders(this.tenantSlug, phone || '', document || '').subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success) {
          this.orders = res.orders || [];
          this.customerName = res.customer?.name || this.customerName;
          if (res.tenant) {
            this.tenantInfo = res.tenant;
            sessionStorage.setItem(`tracker_tenant_${this.tenantSlug}`, JSON.stringify(res.tenant));
          }
          this.updatePagination();
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401 || err.status === 404) {
          this.sessionMissing = true;
        }
      }
    });
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.orders.length / this.pageSize) || 1;
    if (this.currentPage > this.totalPages) {
      this.currentPage = this.totalPages;
    }
    const startIndex = (this.currentPage - 1) * this.pageSize;
    this.paginatedOrders = this.orders.slice(startIndex, startIndex + this.pageSize);
  }

  changePage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
      this.updatePagination();
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  viewDetail(order: PublicOrderSummary): void {
    this.router.navigate(['/org', this.tenantSlug, 'ordenes', order.id]);
  }

  goBack(): void {
    sessionStorage.removeItem(`tracker_phone_${this.tenantSlug}`);
    sessionStorage.removeItem(`tracker_document_${this.tenantSlug}`);
    sessionStorage.removeItem(`tracker_customer_${this.tenantSlug}`);
    this.router.navigate(['/org', this.tenantSlug]);
  }

  getOpMeta(status: string) {
    return OP_META[status] || { label: status, bgClass: 'bg-muted', textClass: 'text-muted-foreground' };
  }

  getPaymentColors(status: string): string {
    const map: Record<string, string> = {
      PAID: 'text-emerald-600',
      PARTIAL: 'text-amber-600',
      PENDING: 'text-destructive'
    };
    return map[status] || 'text-muted-foreground';
  }

  getPaymentLabel(status: string): string {
    const map: Record<string, string> = {
      PAID: 'Pagado',
      PARTIAL: 'Pago parcial',
      PENDING: 'Sin pago'
    };
    return map[status] || status;
  }

  get tenantWhatsapp(): string | null {
    if (this.tenantInfo?.whatsapp) return this.tenantInfo.whatsapp;
    if (this.tenantInfo?.settings?.contact) {
      const wa = this.tenantInfo.settings.contact.find(c => c.name.toLowerCase() === 'whatsapp');
      if (wa && wa.value) return wa.value;
    }
    return null;
  }
}
