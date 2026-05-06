import { Component, EventEmitter, Input, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MaterialService } from '../../../core/services/material/material.service';
import { AppConfigService } from '../../../core/services/app-config/app-config.service';
import { LoaderOverlayComponent } from '../loader-overlay/loader-overlay.component';

interface CalcMaterial {
    material: any;
    quantityExpr: string;
    quantity: number;
    factor: number;
    rawSubtotal: number;  // valor exacto antes del redondeo
    subtotal: number;     // valor redondeado (el que se usa)
}

@Component({
    selector: 'app-item-composition-calculator',
    imports: [CommonModule, FormsModule, LoaderOverlayComponent],
    templateUrl: './item-composition-calculator.component.html',
    styleUrl: './item-composition-calculator.component.scss'
})
export class ItemCompositionCalculatorComponent {
    @Input() initialComposition: any[] = [];
    @Input() set visible(val: boolean) {
        this._visible = val;
        if (val) this.reset();
    }
    get visible() { return this._visible; }

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() compositionApplied = new EventEmitter<{materials: any[], unitPrice: number}>();

    private _visible = false;

    calcMaterials: CalcMaterial[] = [];
    calcGlobalFactor = 1;
    calcMaterialSearch = '';
    calcMaterialResults: any[] = [];
    calcMaterialSearchTimeout: any;
    searching = false;

    get calcMaterialsSum() {
        return this.calcMaterials.reduce((sum, cm) => sum + cm.subtotal, 0);
    }

    get calcTotal() {
        return this.calcMaterialsSum;
    }

    /**
     * Conservative rounding assuming losses:
     * - Values >= 100 → floor to nearest 100 (44.424,35 → 44.400)
     * - Values < 100  → floor to integer     (44,35 → 44)
     */
    roundDown(value: number): number {
        if (value >= 100) {
            return Math.floor(value / 100) * 100;
        }
        return Math.floor(value);
    }

    get isCompositionValid() {
        return this.calcMaterials.length > 0 && this.calcMaterials.every(cm => cm.quantity > 0);
    }

    constructor(
        private materialService: MaterialService,
        public config: AppConfigService,
    ) { }

    reset() {
        if (this.initialComposition && this.initialComposition.length > 0) {
            this.calcMaterials = this.initialComposition.map(c => {
                const raw = c.subtotal || (c.quantity * (c.factor || 1) * c.unitPrice);
                return {
                    material: { id: c.materialId, name: c.name, price: c.unitPrice, unit: c.unitId },
                    quantityExpr: c.quantityExpr,
                    quantity: c.quantity,
                    factor: c.factor || 1,
                    rawSubtotal: raw,
                    subtotal: this.roundDown(raw),
                };
            });
        } else {
            this.calcMaterials = [];
        }
        this.calcMaterialSearch = '';
        this.calcMaterialResults = [];
    }

    close() {
        this._visible = false;
        this.visibleChange.emit(false);
    }

    searchCalcMaterials() {
        clearTimeout(this.calcMaterialSearchTimeout);
        this.calcMaterialSearchTimeout = setTimeout(() => this.searchCalcMaterialsNow(), 300);
    }

    searchCalcMaterialsNow() {
        this.searching = true;
        this.materialService.listSilent(this.calcMaterialSearch || undefined).subscribe({
            next: (res: any) => {
                this.calcMaterialResults = res.data;
                this.searching = false;
            },
            error: () => { this.searching = false; },
        });
    }

    addCalcMaterial(material: any) {
        this.calcMaterials.push({
            material,
            quantityExpr: '',
            quantity: 0,
            factor: 1,
            rawSubtotal: 0,
            subtotal: 0,
        });
        this.calcMaterialSearch = '';
    }

    removeCalcMaterial(i: number) {
        this.calcMaterials.splice(i, 1);
    }

    evalQuantity(expr: string): number {
        if (!expr || !expr.trim()) return 0;
        try {
            if (!/[xX*]/.test(expr)) return 0;
            const sanitized = expr.replace(/[xX]/g, '*');
            if (!/^[\d\s+\-*/.,]+$/.test(sanitized)) return 0;
            const result = Function('"use strict"; return (' + sanitized + ')')();
            return typeof result === 'number' && isFinite(result) ? result : 0;
        } catch {
            return 0;
        }
    }

    onQuantityExprChange(cm: CalcMaterial) {
        cm.quantity = this.evalQuantity(cm.quantityExpr);
        this.recalcMaterial(cm);
    }

    onFactorChange(cm: CalcMaterial) {
        this.recalcMaterial(cm);
    }

    recalcMaterial(cm: CalcMaterial) {
        const price = parseFloat(cm.material.price) || 0;
        cm.rawSubtotal = price * cm.quantity * cm.factor;
        cm.subtotal = this.roundDown(cm.rawSubtotal);
    }

    applyComposition() {
        const composition = this.calcMaterials.map(cm => ({
            materialId: cm.material.id,
            name: cm.material.name,
            quantityExpr: cm.quantityExpr,
            quantity: cm.quantity,
            factor: cm.factor,
            unitPrice: parseFloat(cm.material.price) || 0,
            subtotal: cm.subtotal   // already rounded by recalcMaterial
        }));
        
        this.compositionApplied.emit({
            materials: composition,
            unitPrice: this.roundDown(this.calcTotal)
        });
        this.close();
    }
}
