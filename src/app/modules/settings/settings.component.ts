import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings/settings.service';

@Component({
    selector: 'app-settings',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './settings.component.html',
    styleUrl: './settings.component.scss',
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
    newSupplier = { name: '', phone: '' };
    newTax = { name: '', rate: 0 };

    constructor(private settingsService: SettingsService) { }

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
            next: () => { this.newSupplier = { name: '', phone: '' }; this.loadAll(); },
        });
    }

    addTax() {
        this.settingsService.createTaxConfig(this.newTax).subscribe({
            next: () => { this.newTax = { name: '', rate: 0 }; this.loadAll(); },
        });
    }

    saveFinancial() {
        this.settingsService.updateFinancialConfig(this.financialConfig).subscribe({
            next: () => { alert('Configuración guardada'); },
        });
    }
}
