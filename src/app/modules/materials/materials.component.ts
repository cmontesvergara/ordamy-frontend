import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialService } from '../../core/services/material/material.service';
import { ToastService } from '../../core/services/toast/toast.service';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { AuthService } from '../../core/services/auth/auth.service';

@Component({
    selector: 'app-materials',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './materials.component.html',
    styleUrl: './materials.component.scss',
})
export class MaterialsComponent implements OnInit {
    materials: any[] = [];
    newMaterial = { name: '', description: '', price: 0, unit: '' };
    editing: any = null;
    searchTerm = '';

    canCreate = false;
    canUpdate = false;
    canDelete = false;

    constructor(
        private materialService: MaterialService,
        public config: AppConfigService,
        private toast: ToastService,
        private authService: AuthService,
    ) { }

    ngOnInit() {
        this.authService.getSession().subscribe({
            next: (session: any) => {
                const perms = session?.tenant?.permissions || [];
                if (session?.user?.isSuperAdmin) {
                    this.canCreate = true;
                    this.canUpdate = true;
                    this.canDelete = true;
                } else {
                    this.canCreate = perms.some((p: any) => p.resource === 'materials' && p.action === 'create');
                    this.canUpdate = perms.some((p: any) => p.resource === 'materials' && p.action === 'update');
                    this.canDelete = perms.some((p: any) => p.resource === 'materials' && p.action === 'delete');
                }
            }
        });
        this.loadMaterials();
    }

    loadMaterials() {
        this.materialService.list(this.searchTerm || undefined).subscribe({
            next: (res: any) => { this.materials = res.data; },
        });
    }

    addMaterial() {
        if (!this.newMaterial.name) return;
        this.materialService.create(this.newMaterial).subscribe({
            next: () => {
                this.newMaterial = { name: '', description: '', price: 0, unit: '' };
                this.loadMaterials();
                this.toast.success('Creado', 'Material agregado');
            },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al crear material'); },
        });
    }

    startEdit(item: any) {
        this.editing = { id: item.id, data: { ...item } };
    }

    saveEdit() {
        if (!this.editing) return;
        this.materialService.update(this.editing.id, this.editing.data).subscribe({
            next: () => { this.editing = null; this.loadMaterials(); },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al actualizar'); },
        });
    }

    cancelEdit() {
        this.editing = null;
    }

    deleteMaterial(item: any) {
        if (!confirm(`¿Eliminar "${item.name}"?`)) return;
        this.materialService.delete(item.id).subscribe({
            next: () => {
                this.loadMaterials();
                this.toast.success('Eliminado', 'Material eliminado');
            },
            error: (err: any) => { this.toast.error('Error', err.error?.error || 'Error al eliminar'); },
        });
    }
}
