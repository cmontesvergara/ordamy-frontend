import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings/settings.service';

import { AnalyticsEventName, AnalyticsService } from '../../core/services/analytics/analytics.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
    selector: 'app-settings',
    imports: [FormsModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss'
})
export class SettingsComponent implements OnInit {
    activeTab = 'payment';
    paymentMethods: any[] = [];
    categories: any[] = [];
    suppliers: any[] = [];
    taxConfigs: any[] = [];
    financialConfig: any = null;
    notificationsConfig: any = {
        enabled: false,
        messages: { orderCreated: '' },
        portalUrl: '',
    };

    newPaymentMethod = '';
    newCategory = { name: '', type: 'EXPENSE' };
    newSupplier = { name: '', identification: '', phone: '', email: '' };
    newTax = { name: '', rate: 0 };

    // Generic inline edit state
    editing: any = null;

    constructor(
        private settingsService: SettingsService,
        private appConfig: AppConfigService,
        private toast: ToastService,
        private analytics: AnalyticsService,
    ) { }

    ngOnInit() {
        this.loadAll();
    }

    loadAll() {
        this.settingsService.getPaymentMethods().subscribe({ next: (res: any) => { this.paymentMethods = res.data; } });
        this.settingsService.getCategories().subscribe({ next: (res: any) => { this.categories = res.data; } });
        this.settingsService.getSuppliers().subscribe({ next: (res: any) => { this.suppliers = res.data; } });
        this.settingsService.getTaxConfigs().subscribe({ next: (res: any) => { this.taxConfigs = res.data; } });
        this.settingsService.getFinancialConfig().subscribe({ next: (res: any) => { this.financialConfig = res.data; } });
        this.settingsService.getNotificationsConfig().subscribe({ next: (res: any) => { this.notificationsConfig = res.data; } });
    }

    // ─── Create ───
    addPaymentMethod() {
        this.settingsService.createPaymentMethod({ name: this.newPaymentMethod }).subscribe({
            next: (res: any) => {
                this.analytics.trackEvent({ name: AnalyticsEventName.PaymentMethodCreated, data: { payment_method_id: res.data.id } });
                this.newPaymentMethod = ''; this.loadAll();
            },
        });
    }

    addCategory() {
        this.settingsService.createCategory(this.newCategory).subscribe({
            next: (res: any) => {
                this.analytics.trackEvent({ name: AnalyticsEventName.CategoryCreated, data: { category_id: res.data.id, type: this.newCategory.type } });
                this.newCategory = { name: '', type: 'EXPENSE' }; this.loadAll();
            },
        });
    }

    addSupplier() {
        this.settingsService.createSupplier(this.newSupplier).subscribe({
            next: (res: any) => {
                this.analytics.trackEvent({ name: AnalyticsEventName.SupplierCreated, data: { supplier_id: res.data.id } });
                this.newSupplier = { name: '', identification: '', phone: '', email: '' }; this.loadAll();
            },
        });
    }

    addTax() {
        this.settingsService.createTaxConfig(this.newTax).subscribe({
            next: (res: any) => {
                this.analytics.trackEvent({ name: AnalyticsEventName.TaxConfigCreated, data: { tax_config_id: res.data.id } });
                this.newTax = { name: '', rate: 0 }; this.loadAll();
            },
        });
    }

    saveFinancial() {
        this.settingsService.updateFinancialConfig(this.financialConfig).subscribe({
            next: () => {
                this.analytics.trackEvent({ name: AnalyticsEventName.FinancialConfigUpdated });
                this.appConfig.refresh(); this.toast.success('Guardado', 'Configuración guardada');
            },
        });
    }

    saveNotifications() {
        this.settingsService.updateNotificationsConfig(this.notificationsConfig).subscribe({
            next: () => {
                this.toast.success('Guardado', 'Configuración de notificaciones guardada');
            },
            error: (err: any) => {
                this.toast.error('Error', err.error?.error || 'Error al guardar notificaciones');
            },
        });
    }

    openConnectChannel() {
        window.open('https://connect.bigso.org', '_blank');
    }

    // ─── Edit (generic) ───
    startEdit(type: string, item: any) {
        this.editing = { id: item.id, type, data: { ...item } };
    }

    saveEdit(type: string) {
        if (!this.editing) return;
        const { id, data } = this.editing;

        const eventByType: Record<string, AnalyticsEventName> = {
            payment: AnalyticsEventName.PaymentMethodUpdated,
            category: AnalyticsEventName.CategoryUpdated,
            supplier: AnalyticsEventName.SupplierUpdated,
            tax: AnalyticsEventName.TaxConfigUpdated,
        };

        const obs = type === 'payment' ? this.settingsService.updatePaymentMethod(id, data)
            : type === 'category' ? this.settingsService.updateCategory(id, data)
                : type === 'supplier' ? this.settingsService.updateSupplier(id, data)
                    : this.settingsService.updateTaxConfig(id, data);

        obs.subscribe({
            next: () => {
                this.analytics.trackEvent({ name: eventByType[type], data: { [`${type}_id`]: id } });
                this.editing = null; this.loadAll();
            },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al actualizar'); },
        });
    }

    // ─── Delete (generic) ───
    deleteItem(type: string, item: any) {
        const labels: any = { payment: 'medio de pago', category: 'categoría', supplier: 'proveedor', tax: 'configuración de impuesto' };
        if (!confirm(`¿Eliminar ${labels[type]} "${item.name}"?`)) return;

        const eventByType: Record<string, AnalyticsEventName> = {
            payment: AnalyticsEventName.PaymentMethodDeleted,
            category: AnalyticsEventName.CategoryDeleted,
            supplier: AnalyticsEventName.SupplierDeleted,
            tax: AnalyticsEventName.TaxConfigDeleted,
        };

        const obs = type === 'payment' ? this.settingsService.deletePaymentMethod(item.id)
            : type === 'category' ? this.settingsService.deleteCategory(item.id)
                : type === 'supplier' ? this.settingsService.deleteSupplier(item.id)
                    : this.settingsService.deleteTaxConfig(item.id);

        obs.subscribe({
            next: () => {
                this.analytics.trackEvent({ name: eventByType[type], data: { [`${type}_id`]: item.id } });
                this.loadAll();
            },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al eliminar'); },
        });
    }
}
