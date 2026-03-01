import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class SettingsService {
    private url = `${environment.authApiUrl}/api/settings`;

    constructor(private http: HttpClient) { }

    // Payment Methods
    getPaymentMethods() {
        return this.http.get<any>(`${this.url}/payment-methods`, { withCredentials: true });
    }
    createPaymentMethod(data: any) {
        return this.http.post<any>(`${this.url}/payment-methods`, data, { withCredentials: true });
    }
    updatePaymentMethod(id: string, data: any) {
        return this.http.put<any>(`${this.url}/payment-methods/${id}`, data, { withCredentials: true });
    }
    deletePaymentMethod(id: string) {
        return this.http.delete<any>(`${this.url}/payment-methods/${id}`, { withCredentials: true });
    }

    // Categories
    getCategories(type?: string) {
        const params = type ? `?type=${type}` : '';
        return this.http.get<any>(`${this.url}/categories${params}`, { withCredentials: true });
    }
    createCategory(data: any) {
        return this.http.post<any>(`${this.url}/categories`, data, { withCredentials: true });
    }
    updateCategory(id: string, data: any) {
        return this.http.put<any>(`${this.url}/categories/${id}`, data, { withCredentials: true });
    }
    deleteCategory(id: string) {
        return this.http.delete<any>(`${this.url}/categories/${id}`, { withCredentials: true });
    }

    // Suppliers
    getSuppliers(search?: string) {
        const params = search ? `?search=${search}` : '';
        return this.http.get<any>(`${this.url}/suppliers${params}`, { withCredentials: true });
    }
    createSupplier(data: any) {
        return this.http.post<any>(`${this.url}/suppliers`, data, { withCredentials: true });
    }
    updateSupplier(id: string, data: any) {
        return this.http.put<any>(`${this.url}/suppliers/${id}`, data, { withCredentials: true });
    }
    deleteSupplier(id: string) {
        return this.http.delete<any>(`${this.url}/suppliers/${id}`, { withCredentials: true });
    }

    // Tax Configs
    getTaxConfigs() {
        return this.http.get<any>(`${this.url}/tax-configs`, { withCredentials: true });
    }
    createTaxConfig(data: any) {
        return this.http.post<any>(`${this.url}/tax-configs`, data, { withCredentials: true });
    }
    updateTaxConfig(id: string, data: any) {
        return this.http.put<any>(`${this.url}/tax-configs/${id}`, data, { withCredentials: true });
    }
    deleteTaxConfig(id: string) {
        return this.http.delete<any>(`${this.url}/tax-configs/${id}`, { withCredentials: true });
    }

    // Financial Config
    getFinancialConfig() {
        return this.http.get<any>(`${this.url}/financial`, { withCredentials: true });
    }
    updateFinancialConfig(data: any) {
        return this.http.put<any>(`${this.url}/financial`, data, { withCredentials: true });
    }
}
