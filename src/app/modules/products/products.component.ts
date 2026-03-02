import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProductService } from '../../core/services/product/product.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
    selector: 'app-products',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './products.component.html',
    styleUrl: './products.component.scss',
})
export class ProductsComponent implements OnInit {
    products: any[] = [];
    newProduct = { name: '', description: '', basePrice: 0, unit: '' };
    editing: any = null;
    searchTerm = '';

    canCreate = false;
    canUpdate = false;

    constructor(
        private productService: ProductService,
        public config: AppConfigService,
        private toast: ToastService,
        private authService: AuthService,
    ) { }

    ngOnInit() {
        this.authService.getSession().subscribe({
            next: (session: any) => {
                const perms = session?.tenant?.permissions || [];
                // Admin bypass via isSuperAdmin
                if (session?.user?.isSuperAdmin) {
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
            next: () => {
                this.newProduct = { name: '', description: '', basePrice: 0, unit: '' };
                this.loadProducts();
                this.toast.success('Creado', 'Producto agregado');
            },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al crear producto'); },
        });
    }

    startEdit(item: any) {
        this.editing = { id: item.id, data: { ...item } };
    }

    saveEdit() {
        if (!this.editing) return;
        this.productService.update(this.editing.id, this.editing.data).subscribe({
            next: () => { this.editing = null; this.loadProducts(); },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al actualizar'); },
        });
    }

    cancelEdit() {
        this.editing = null;
    }
}
