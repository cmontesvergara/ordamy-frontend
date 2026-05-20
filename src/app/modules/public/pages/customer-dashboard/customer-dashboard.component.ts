import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { DashboardHeaderComponent } from '../../../../shared/components/dashboard-header/dashboard-header.component';
import { 
  PublicOrderService, 
  PublicTenantInfo, 
  PublicOrderSummary 
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
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule, DashboardHeaderComponent],
  templateUrl: './customer-dashboard.component.html',
  styleUrls: ['../../_tracker.scss']
})
export class CustomerDashboardComponent implements OnInit {
  tenantSlug = '';
  customerName = '';
  tenantInfo: PublicTenantInfo | null = null;
  
  // Orders
  orders: PublicOrderSummary[] = [];
  loadingOrders = true;
  showOrdersSection = true;
  sessionMissing = false;

  // Selected order for preview
  selectedOrder: PublicOrderSummary | null = null;

  // Pagination
  currentPage = 1;
  pageSize = 5;
  totalPages = 1;
  paginatedOrders: PublicOrderSummary[] = [];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicOrderService: PublicOrderService
  ) { }

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') || '';

    // Get stored session data
    const phone = sessionStorage.getItem(`tracker_phone_${this.tenantSlug}`);
    const document = sessionStorage.getItem(`tracker_document_${this.tenantSlug}`);
    const tenantRaw = sessionStorage.getItem(`tracker_tenant_${this.tenantSlug}`);

    if (!phone && !document) {
      // No session, redirect to portal usuarios tenant page
      this.router.navigate(['portal-usuarios', this.tenantSlug]);
      return;
    }

    this.customerName = sessionStorage.getItem(`tracker_customer_${this.tenantSlug}`) || 'Cliente';

    if (tenantRaw) {
      try {
        this.tenantInfo = JSON.parse(tenantRaw);
      } catch {
        this.tenantInfo = null;
      }
    }

    // Load orders
    this.loadOrders(phone, document);
  }

  loadOrders(phone: string | null, document: string | null): void {
    this.loadingOrders = true;
    
    this.publicOrderService.getCustomerOrders(this.tenantSlug, phone || '', document || '').subscribe({
      next: (res) => {
        this.loadingOrders = false;
        if (res.success) {
          this.orders = res.orders || [];
          this.updatePagination();
          this.customerName = res.customer?.name || this.customerName;
          if (res.tenant) {
            this.tenantInfo = res.tenant;
            sessionStorage.setItem(`tracker_tenant_${this.tenantSlug}`, JSON.stringify(res.tenant));
          }
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loadingOrders = false;
        if (err.status === 401 || err.status === 404) {
          this.sessionMissing = true;
        }
      }
    });
  }

  viewOrderDetail(order: PublicOrderSummary): void {
    // On mobile, navigate directly to detail instead of showing preview
    if (window.innerWidth < 1024) {
      this.goToFullDetail(order);
    } else {
      this.selectedOrder = order;
    }
  }

  closePreview(): void {
    this.selectedOrder = null;
  }

  goToFullDetail(order: PublicOrderSummary): void {
    this.router.navigate(['portal-usuarios', this.tenantSlug, 'ordenes', order.id]);
  }

  viewAllOrders(): void {
    this.pageSize = 20; // Show more orders
    this.updatePagination();
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
    }
  }

  goToTrack(): void {
    this.router.navigate(['portal-usuarios', this.tenantSlug, 'rastrear']);
  }

  goToContact(): void {
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
    if (this.tenantInfo?.contacts) {
      const wa = this.tenantInfo.contacts.find((c) => c.type === 'whatsapp');
      if (wa && wa.value) return wa.value;
    }
    return null;
  }


  // Computed properties for stats
  get activeOrdersCount(): number {
    return this.orders.filter(o => ['PENDING', 'APPROVED', 'IN_PRODUCTION'].includes(o.operationalStatus)).length;
  }

  get deliveredOrdersCount(): number {
    return this.orders.filter(o => o.operationalStatus === 'DELIVERED').length;
  }

  get totalSpent(): number {
    return this.orders.reduce((sum, o) => sum + o.total, 0);
  }


  logout(): void {
    // Clear session for this tenant
    sessionStorage.removeItem(`tracker_phone_${this.tenantSlug}`);
    sessionStorage.removeItem(`tracker_document_${this.tenantSlug}`);
    sessionStorage.removeItem(`tracker_customer_${this.tenantSlug}`);
    sessionStorage.removeItem(`tracker_tenant_${this.tenantSlug}`);
    // Redirect to portal usuarios tenant page
    this.router.navigate(['portal-usuarios', this.tenantSlug]);
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('');
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-CO', { day: 'numeric', month: 'short', year: 'numeric' });
  }
}
