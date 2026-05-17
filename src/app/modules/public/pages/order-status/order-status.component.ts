import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import {
  PublicOrderService,
  PublicOrderDetail,
  PublicTenantInfo
} from '../../../../core/services/public/public-order.service';

const STEPS = ['PENDING', 'APPROVED', 'IN_PRODUCTION', 'PRODUCED', 'DELIVERED'];

const OP_META: Record<string, { label: string; bgClass: string; textClass: string; explanation: string; action: string }> = {
  PENDING: {
    label: 'Recibida', bgClass: 'bg-muted', textClass: 'text-muted-foreground',
    explanation: 'Tu pedido fue registrado exitosamente y está en espera de que el equipo lo revise y apruebe.',
    action: 'No necesitas hacer nada ahora. Espera la confirmación.'
  },
  APPROVED: {
    label: 'Aprobada', bgClass: 'bg-blue-100', textClass: 'text-blue-700',
    explanation: 'Tu pedido fue revisado y aprobado. Está listo para iniciar producción.',
    action: 'Si tienes saldo pendiente, este es el mejor momento para coordinarlo.'
  },
  IN_PRODUCTION: {
    label: 'En producción', bgClass: 'bg-indigo-100', textClass: 'text-indigo-700',
    explanation: 'El equipo está fabricando tu pedido activamente en este momento.',
    action: 'No necesitas hacer nada. Pronto recibirás aviso cuando esté listo.'
  },
  PRODUCED: {
    label: 'Lista para entrega', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700',
    explanation: '¡Tu pedido está terminado! Solo falta coordinar la entrega o el recogido.',
    action: 'Comunícate para coordinar cuándo y cómo recibes tu pedido.'
  },
  DELIVERED: {
    label: 'Entregada', bgClass: 'bg-emerald-100', textClass: 'text-emerald-700',
    explanation: 'Tu pedido fue entregado exitosamente. Esperamos que estés muy satisfecho.',
    action: '¡Gracias por tu confianza! Esperamos verte pronto de nuevo.'
  },
  CANCELLED: {
    label: 'Anulada', bgClass: 'bg-destructive/10', textClass: 'text-destructive',
    explanation: 'Esta orden fue anulada y ya no está activa.',
    action: 'Comunícate con el negocio si tienes dudas sobre la anulación.'
  },
};

@Component({
  selector: 'app-order-status',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './order-status.component.html',
  styleUrls: ['../../_tracker.scss']
})
export class OrderStatusComponent implements OnInit {
  tenantSlug = '';
  orderId = '';
  order: PublicOrderDetail | null = null;
  tenantInfo: PublicTenantInfo | null = null;
  loading = true;
  sessionMissing = false;
  errorState = false;

  currentStepIndex = 0;
  currentOpMeta = OP_META['PENDING'];

  readonly timelineSteps = [
    { key: 'PENDING',       label: 'Recibida' },
    { key: 'APPROVED',      label: 'Aprobada' },
    { key: 'IN_PRODUCTION', label: 'En prod.' },
    { key: 'PRODUCED',      label: 'Lista' },
    { key: 'DELIVERED',     label: 'Entregada' },
  ];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private publicOrderService: PublicOrderService
  ) {}

  ngOnInit(): void {
    this.tenantSlug = this.route.snapshot.paramMap.get('tenantSlug') || '';
    this.orderId    = this.route.snapshot.paramMap.get('orderId') || '';

    const phone    = sessionStorage.getItem(`tracker_phone_${this.tenantSlug}`);
    const tenantRaw = sessionStorage.getItem(`tracker_tenant_${this.tenantSlug}`);
    if (tenantRaw) { try { this.tenantInfo = JSON.parse(tenantRaw); } catch {} }

    if (!phone) {
      this.loading = false;
      this.sessionMissing = true;
      return;
    }

    this.publicOrderService.getOrderDetail(this.tenantSlug, this.orderId, phone).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.success && res.order) {
          this.order = res.order;
          
          // Pre-calculate to avoid change detection slowness
          const idx = STEPS.indexOf(this.order.operationalStatus || '');
          this.currentStepIndex = idx >= 0 ? idx : 0;
          this.currentOpMeta = OP_META[this.order.operationalStatus || ''] || OP_META['PENDING'];

          if (res.tenant) {
            this.tenantInfo = res.tenant;
            sessionStorage.setItem(`tracker_tenant_${this.tenantSlug}`, JSON.stringify(res.tenant));
          }
        } else {
          this.errorState = true;
        }
      },
      error: (err: HttpErrorResponse) => {
        this.loading = false;
        if (err.status === 401 || err.status === 403) { this.sessionMissing = true; }
        else { this.errorState = true; }
      }
    });
  }

  translateStatus(status: string): string {
    return OP_META[status]?.label || status;
  }

  goToList(): void {
    this.router.navigate(['/org', this.tenantSlug, 'pedidos']);
  }

  goToValidate(): void {
    this.router.navigate(['/org', this.tenantSlug]);
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
