import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface PublicTenantInfo {
  name: string;
  slug: string;
  phone: string | null;
  email: string | null;
  whatsapp: string | null;
  settings?: {
    contact?: { name: string; value: string }[];
  };
}

export interface PublicOrderSummary {
  id: string;
  orderNumber: string;
  createdAt: string;
  dueDate: string | null;
  status: string;
  operationalStatus: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  total: number;
  paid: number;
  balance: number;
  itemSummary: string;
}

export interface PublicOrderDetail {
  id: string;
  orderNumber: string;
  createdAt: string;
  dueDate: string | null;
  status: string;
  operationalStatus: string;
  paymentStatus: 'PAID' | 'PARTIAL' | 'PENDING';
  total: number;
  paid: number;
  balance: number;
  customer: { name: string };
  items: { description: string; quantity: number; unitPrice: number; lineTotal: number }[];
  history: { status: string; description: string; changedAt: string }[];
}

export interface CustomerOrdersResponse {
  success: boolean;
  customer?: { name: string };
  orders?: PublicOrderSummary[];
  tenant?: PublicTenantInfo;
  error?: string;
  message?: string;
}

export interface OrderDetailResponse {
  success: boolean;
  order?: PublicOrderDetail;
  tenant?: PublicTenantInfo;
  error?: string;
  message?: string;
}

@Injectable({ providedIn: 'root' })
export class PublicOrderService {
  private base = `${environment.middlewareBaseUrl}/api/public`;

  constructor(private http: HttpClient) {}

  /**
   * Validate customer by phone and get all their active orders
   */
  getCustomerOrders(tenantSlug: string, phone: string): Observable<CustomerOrdersResponse> {
    return this.http.get<CustomerOrdersResponse>(
      `${this.base}/${tenantSlug}/orders`,
      { params: { phone } }
    );
  }

  /**
   * Get full detail of a specific order — re-validates phone
   */
  getOrderDetail(tenantSlug: string, orderId: string, phone: string): Observable<OrderDetailResponse> {
    return this.http.get<OrderDetailResponse>(
      `${this.base}/${tenantSlug}/orders/${orderId}`,
      { params: { phone } }
    );
  }
}
