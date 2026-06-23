import { CommonModule } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { SettingsService } from '../../core/services/settings/settings.service';

import { AnalyticsEventName, AnalyticsService } from '../../core/services/analytics/analytics.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { SessionService } from '../../core/services/session/session.service';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
    selector: 'app-settings',
    imports: [CommonModule, FormsModule],
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
        channelId: null,
        messages: { orderCreated: '' },
        portalUrl: '',
    };
    originalNotificationsConfig: any = null;
    whatsappChannels: any[] = [];
    testPhone = '';
    testResult: any = null;
    loadingChannels = false;
    sendingTest = false;
    saving = false;
    hasChanges = false;

    newPaymentMethod = '';
    newCategory = { name: '', type: 'EXPENSE' };
    newSupplier = { name: '', identification: '', phone: '', email: '' };
    newTax = { name: '', rate: 0 };

    // Generic inline edit state
    editing: any = null;

    @ViewChild('messageTextarea') messageTextarea!: ElementRef<HTMLTextAreaElement>;

    constructor(
        private settingsService: SettingsService,
        private appConfig: AppConfigService,
        private toast: ToastService,
        private analytics: AnalyticsService,
        private session: SessionService,
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
        this.settingsService.getNotificationsConfig().subscribe({
            next: (res: any) => {
                this.notificationsConfig = res.data;
                this.originalNotificationsConfig = JSON.parse(JSON.stringify(res.data));
                this.hasChanges = false;
                this.loadWhatsAppChannels();
            }
        });
    }

    loadWhatsAppChannels() {
        this.loadingChannels = true;
        this.settingsService.getWhatsAppChannels().subscribe({
            next: (res: any) => {
                this.whatsappChannels = res.data || [];
                this.loadingChannels = false;
                console.log('[Settings] WhatsApp channels loaded:', this.whatsappChannels);
            },
            error: (err: any) => {
                this.loadingChannels = false;
                console.error('[Settings] Failed to load WhatsApp channels:', err);
                this.toast.error('Error', 'No se pudieron cargar los canales de WhatsApp');
            },
        });
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

    markDirty() {
        this.hasChanges = true;
    }

    resetNotifications() {
        if (this.originalNotificationsConfig) {
            this.notificationsConfig = JSON.parse(JSON.stringify(this.originalNotificationsConfig));
        }
        this.hasChanges = false;
    }

    insertVariable(variableName: string) {
        const textarea = this.messageTextarea?.nativeElement;
        if (!textarea) return;

        const start = textarea.selectionStart;
        const end = textarea.selectionEnd;
        const text = textarea.value;
        const before = text.substring(0, start);
        const after = text.substring(end);
        const insertion = `{{${variableName}}}`;

        this.notificationsConfig.messages.orderCreated = before + insertion + after;
        this.markDirty();

        // Restore focus and set cursor after inserted text
        setTimeout(() => {
            textarea.focus();
            const newCursor = start + insertion.length;
            textarea.setSelectionRange(newCursor, newCursor);
        });
    }

    get selectedChannelStatus(): string | null {
        if (!this.notificationsConfig.channelId) return null;
        const channel = this.whatsappChannels.find((c: any) => c.id === this.notificationsConfig.channelId);
        return channel?.status || null;
    }

    get previewMessage(): string {
        let msg = this.notificationsConfig.messages.orderCreated || '';
        msg = msg.replace(/\{\{customerName\}\}/g, 'Carlos');
        msg = msg.replace(/\{\{orderNumber\}\}/g, 'ORD-1024');
        msg = msg.replace(/\{\{portalUrl\}\}/g, this.notificationsConfig.portalUrl || 'https://ordamy.com/portal-usuarios');
        return msg;
    }

    saveNotifications() {
        this.saving = true;
        console.log('[Settings] Saving notifications config:', this.notificationsConfig);
        this.settingsService.updateNotificationsConfig(this.notificationsConfig).subscribe({
            next: (res: any) => {
                this.saving = false;
                this.notificationsConfig = res.data;
                this.originalNotificationsConfig = JSON.parse(JSON.stringify(res.data));
                this.hasChanges = false;
                this.toast.success('Guardado', 'Configuración de notificaciones guardada');
            },
            error: (err: any) => {
                this.saving = false;
                console.error('[Settings] Failed to save notifications config:', err);
                this.toast.error('Error', err.error?.error || 'Error al guardar notificaciones');
            },
        });
    }

    sendTestMessage() {
        if (!this.testPhone || !this.notificationsConfig.messages.orderCreated) {
            this.toast.error('Error', 'Ingresa un teléfono y un mensaje de prueba');
            return;
        }

        this.sendingTest = true;
        this.testResult = null;
        const payload = {
            phone: this.testPhone,
            message: this.notificationsConfig.messages.orderCreated,
            channelId: this.notificationsConfig.channelId,
        };
        console.log('[Settings] Sending test message:', payload);

        this.settingsService.sendTestNotification(payload).subscribe({
            next: (res: any) => {
                this.sendingTest = false;
                this.testResult = { success: true, data: res.data };
                console.log('[Settings] Test message sent:', res.data);
                this.toast.success('Enviado', 'Mensaje de prueba enviado correctamente');
            },
            error: (err: any) => {
                this.sendingTest = false;
                const isChannelInactive = err.status === 424 || err.error?.detail === 'channel_connection_inactive';
                const errorMessage = isChannelInactive
                    ? (err.error?.error || 'El canal no tiene una conexión activa. Reconecta el canal en BigSo Connect.')
                    : (err.error?.error || 'No fue posible enviar el mensaje.');
                this.testResult = { success: false, error: errorMessage, detail: err.error?.detail || null };
                console.error('[Settings] Test message failed:', err);
                this.toast.error('No fue posible enviar el mensaje.', errorMessage);
            },
        });
    }

    openConnectChannel() {
        const tenantId = this.session.getCurrentTenant()?.id;
        const url = tenantId
            ? `https://connect.bigso.org?x-tenant-id=${encodeURIComponent(tenantId)}`
            : 'https://connect.bigso.org';
        window.open(url, '_blank');
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
