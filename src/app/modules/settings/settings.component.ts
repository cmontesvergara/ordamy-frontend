import { Component, OnInit } from '@angular/core';

import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings/settings.service';

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

    newPaymentMethod = '';
    newCategory = { name: '', type: 'EXPENSE' };
    newSupplier = { name: '', identification: '', phone: '', email: '' };
    newTax = { name: '', rate: 0 };

    // Generic inline edit state
    editing: any = null;

    constructor(private settingsService: SettingsService, private appConfig: AppConfigService, private toast: ToastService) { }

    ngOnInit() {
        this.loadAll();
    }

    loadAll() {
        this.settingsService.getPaymentMethods().subscribe({ next: (res: any) => { this.paymentMethods = res.data; } });
        this.settingsService.getCategories().subscribe({ next: (res: any) => { this.categories = res.data; } });
        this.settingsService.getSuppliers().subscribe({ next: (res: any) => { this.suppliers = res.data; } });
        this.settingsService.getTaxConfigs().subscribe({ next: (res: any) => { this.taxConfigs = res.data; } });
        this.settingsService.getFinancialConfig().subscribe({ next: (res: any) => { this.financialConfig = res.data; } });
    }

    // ─── Create ───
    addPaymentMethod() {
        this.settingsService.createPaymentMethod({ name: this.newPaymentMethod }).subscribe({
            next: () => { this.newPaymentMethod = ''; this.loadAll(); },
        });
    }

    addCategory() {
        this.settingsService.createCategory(this.newCategory).subscribe({
            next: () => { this.newCategory = { name: '', type: 'EXPENSE' }; this.loadAll(); },
        });
    }

    addSupplier() {
        this.settingsService.createSupplier(this.newSupplier).subscribe({
            next: () => { this.newSupplier = { name: '', identification: '', phone: '', email: '' }; this.loadAll(); },
        });
    }

    addTax() {
        this.settingsService.createTaxConfig(this.newTax).subscribe({
            next: () => { this.newTax = { name: '', rate: 0 }; this.loadAll(); },
        });
    }

    saveFinancial() {
        this.settingsService.updateFinancialConfig(this.financialConfig).subscribe({
            next: () => { this.appConfig.refresh(); this.toast.success('Guardado', 'Configuración guardada'); },
        });
    }

    // ─── Edit (generic) ───
    startEdit(type: string, item: any) {
        this.editing = { id: item.id, type, data: { ...item } };
    }

    saveEdit(type: string) {
        if (!this.editing) return;
        const { id, data } = this.editing;

        const obs = type === 'payment' ? this.settingsService.updatePaymentMethod(id, data)
            : type === 'category' ? this.settingsService.updateCategory(id, data)
                : type === 'supplier' ? this.settingsService.updateSupplier(id, data)
                    : this.settingsService.updateTaxConfig(id, data);

        obs.subscribe({
            next: () => { this.editing = null; this.loadAll(); },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al actualizar'); },
        });
    }

    // ─── Delete (generic) ───
    deleteItem(type: string, item: any) {
        const labels: any = { payment: 'medio de pago', category: 'categoría', supplier: 'proveedor', tax: 'configuración de impuesto' };
        if (!confirm(`¿Eliminar ${labels[type]} "${item.name}"?`)) return;

        const obs = type === 'payment' ? this.settingsService.deletePaymentMethod(item.id)
            : type === 'category' ? this.settingsService.deleteCategory(item.id)
                : type === 'supplier' ? this.settingsService.deleteSupplier(item.id)
                    : this.settingsService.deleteTaxConfig(item.id);

        obs.subscribe({
            next: () => { this.loadAll(); },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al eliminar'); },
        });
    }
}
