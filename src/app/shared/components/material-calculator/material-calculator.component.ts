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
    subtotal: number;
}

@Component({
    selector: 'app-material-calculator',
    imports: [CommonModule, FormsModule, LoaderOverlayComponent],
    templateUrl: './material-calculator.component.html',
    styleUrl: './material-calculator.component.scss'
})
export class MaterialCalculatorComponent {
    @Input() set visible(val: boolean) {
        this._visible = val;
        if (val) this.reset();
    }
    get visible() { return this._visible; }

    @Output() visibleChange = new EventEmitter<boolean>();
    @Output() priceApplied = new EventEmitter<number>();

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
        return this.calcMaterialsSum * this.calcGlobalFactor;
    }

    constructor(
        private materialService: MaterialService,
        public config: AppConfigService,
    ) { }

    reset() {
        this.calcMaterials = [];
        this.calcGlobalFactor = 1;
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
            quantityExpr: '1',
            quantity: 1,
            factor: 1,
            subtotal: parseFloat(material.price) || 0,
        });
        this.calcMaterialSearch = '';
    }

    removeCalcMaterial(i: number) {
        this.calcMaterials.splice(i, 1);
    }

    evalQuantity(expr: string): number {
        if (!expr || !expr.trim()) return 0;
        try {
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
        cm.subtotal = price * cm.quantity * cm.factor;
    }

    applyPrice() {
        this.priceApplied.emit(Math.round(this.calcTotal * 100) / 100);
        this.close();
    }
}
