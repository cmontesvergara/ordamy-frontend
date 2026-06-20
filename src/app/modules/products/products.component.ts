import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AnalyticsEventName, AnalyticsService } from '../../core/services/analytics/analytics.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { ProductService } from '../../core/services/product/product.service';
import { SessionService } from '../../core/services/session/session.service';
import { ToastService } from '../../core/services/toast/toast.service';

@Component({
    selector: 'app-products',
    imports: [CommonModule, FormsModule],
    templateUrl: './products.component.html',
    styleUrl: './products.component.scss'
})
export class ProductsComponent implements OnInit {
    products: any[] = [];
    newProduct = { name: '', description: '', basePrice: 0, unit: '' };
    editing: any = null;
    searchTerm = '';
    showCreateForm = false;

    canCreate = false;
    canUpdate = false;

    constructor(
        private productService: ProductService,
        public config: AppConfigService,
        private toast: ToastService,
        private sessionService: SessionService,
        private analytics: AnalyticsService,
    ) { }

    ngOnInit() {
        this.sessionService.getSession().subscribe({
            next: (session: any) => {
                const perms = session?.tenant?.permissions || [];
                if (session?.user?.systemRole === 'admin') {
                    this.canCreate = true;
                    this.canUpdate = true;
                } else {
                    this.canCreate = perms.some((p: any) => p.resource === 'products' && p.action === 'create');
                    this.canUpdate = perms.some((p: any) => p.resource === 'products' && p.action === 'update');
                }
            }
        });
        this.loadProducts();
    }

    loadProducts() {
        this.productService.list(this.searchTerm || undefined).subscribe({
            next: (res: any) => { this.products = res.data; },
        });
    }

    addProduct() {
        if (!this.newProduct.name) return;
        this.productService.create(this.newProduct).subscribe({
            next: (res: any) => {
                this.analytics.trackEvent({ name: AnalyticsEventName.ProductCreated, data: { product_id: res.data.id } });
                this.newProduct = { name: '', description: '', basePrice: 0, unit: '' };
                this.showCreateForm = false;
                this.loadProducts();
                this.toast.success('Creado', 'Producto agregado');
            },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al crear producto'); },
        });
    }

    cancelCreate() {
        this.newProduct = { name: '', description: '', basePrice: 0, unit: '' };
        this.showCreateForm = false;
    }

    startEdit(item: any) {
        this.editing = { id: item.id, data: { ...item } };
    }

    saveEdit() {
        if (!this.editing) return;
        this.productService.update(this.editing.id, this.editing.data).subscribe({
            next: () => {
                this.analytics.trackEvent({ name: AnalyticsEventName.ProductUpdated, data: { product_id: this.editing.id } });
                this.editing = null; this.loadProducts();
            },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al actualizar'); },
        });
    }

    cancelEdit() {
        this.editing = null;
    }
}
