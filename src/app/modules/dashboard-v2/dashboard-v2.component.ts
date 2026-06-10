import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { AppConfigService } from '../../core/services/app-config/app-config.service';
import { ReportService } from '../../core/services/report/report.service';

interface DashboardData {
    profitThisMonth: number;
    salesThisMonth: number;
    salesLastMonth: number;
    salesChange: number | null;
    expensesThisMonth: number;
    expensesLastMonth: number;
    expensesChange: number | null;
    activeOrders: number;
    portfolioBalance: number;
    customersThisMonth: number;
    accounts: { id: number; name: string; balance: number }[];
    topClientsBySales: { id: number; name: string; totalSales: number; orderCount: number }[];
    topClientsWithDebt: { id: number; name: string; totalDebt: number; orderCount: number }[];
    expensesByCategory: { categoryName: string; total: number; count: number }[];
    ordersByOperationalStatus: { status: string; count: number }[];
}

@Component({
    selector: 'app-dashboard-v2',
    imports: [CommonModule],
    templateUrl: './dashboard-v2.component.html',
    styleUrl: './dashboard-v2.component.scss'
})
export class DashboardV2Component implements OnInit {
    data: DashboardData | null = null;

    operationalSteps = [
        { key: 'PENDING', label: 'Pendiente', color: '#64748b', bg: '#f1f5f9' },
        { key: 'APPROVED', label: 'Aprobada', color: '#3b82f6', bg: '#eff6ff' },
        { key: 'IN_PRODUCTION', label: 'En producción', color: '#f59e0b', bg: '#fffbeb' },
        { key: 'PRODUCED', label: 'Producida', color: '#8b5cf6', bg: '#f5f3ff' },
        { key: 'DELIVERED', label: 'Entregada', color: '#10b981', bg: '#ecfdf5' },
    ];

    expenseColors = ['#3b82f6', '#06b6d4', '#f59e0b', '#64748b', '#ef4444', '#8b5cf6', '#10b981'];

    // Fake 12-month historical data for v1.5 charts (will be replaced by real API data in v2.0)
    monthlyHistory = [
        { month: 'Jul', sales: 25_000_000, expenses: 18_000_000 },
        { month: 'Ago', sales: 32_000_000, expenses: 22_000_000 },
        { month: 'Sep', sales: 45_000_000, expenses: 28_000_000 },
        { month: 'Oct', sales: 48_000_000, expenses: 35_000_000 },
        { month: 'Nov', sales: 55_000_000, expenses: 38_000_000 },
        { month: 'Dic', sales: 62_000_000, expenses: 42_000_000 },
        { month: 'Ene', sales: 40_000_000, expenses: 30_000_000 },
        { month: 'Feb', sales: 38_000_000, expenses: 28_000_000 },
        { month: 'Mar', sales: 35_000_000, expenses: 25_000_000 },
        { month: 'Abr', sales: 30_000_000, expenses: 22_000_000 },
        { month: 'May', sales: 25_000_000, expenses: 18_000_000 },
        { month: 'Jun', sales: 20_000_000, expenses: 15_000_000 },
    ];

    get monthlyProfit(): number[] {
        return this.monthlyHistory.map((m) => m.sales - m.expenses);
    }

    get profitChartMax(): number {
        const profits = this.monthlyProfit;
        return Math.max(...profits.map((p) => Math.abs(p)), 1);
    }

    // Fake sparkline data for v1.5 (will be replaced by real historical data in v2.0)
    sparklines = {
        profit: [40, 35, 45, 30, 55, 40, 25, 50, 35, 20, 15, 10],
        sales: [60, 55, 70, 50, 80, 65, 45, 75, 55, 35, 25, 15],
        expenses: [50, 45, 60, 55, 65, 70, 60, 80, 75, 65, 55, 50],
        portfolio: [30, 35, 40, 38, 45, 50, 48, 55, 60, 58, 62, 65],
    };

    constructor(private reportService: ReportService, public config: AppConfigService) { }

    ngOnInit() {
        this.reportService.getDashboard().subscribe({
            next: (res: any) => { this.data = res.data; },
        });
    }

    get activeOrdersTotal(): number {
        if (!this.data?.ordersByOperationalStatus) return 0;
        return this.data.ordersByOperationalStatus.reduce((sum, o) => sum + o.count, 0);
    }

    getOpCount(status: string): number {
        if (!this.data?.ordersByOperationalStatus) return 0;
        const found = this.data.ordersByOperationalStatus.find((o) => o.status === status);
        return found?.count || 0;
    }

    getOpPercent(status: string): number {
        const total = this.activeOrdersTotal;
        if (!total) return 0;
        return Math.round((this.getOpCount(status) / total) * 100);
    }

    get accountsTotal(): number {
        if (!this.data?.accounts) return 0;
        return this.data.accounts.reduce((sum, a) => sum + Number(a.balance || 0), 0);
    }

    get availableBalance(): number {
        if (!this.data?.accounts) return 0;
        return this.data.accounts
            .filter((a) => a.balance > 0)
            .reduce((sum, a) => sum + Number(a.balance || 0), 0);
    }

    get maxClientSales(): number {
        if (!this.data?.topClientsBySales?.length) return 1;
        return Math.max(...this.data.topClientsBySales.map((c) => c.totalSales));
    }

    get maxClientDebt(): number {
        if (!this.data?.topClientsWithDebt?.length) return 1;
        return Math.max(...this.data.topClientsWithDebt.map((c) => c.totalDebt));
    }

    get maxExpenseCategory(): number {
        if (!this.data?.expensesByCategory?.length) return 1;
        return Math.max(...this.data.expensesByCategory.map((e) => e.total));
    }

    get maxAccountBalance(): number {
        if (!this.data?.accounts?.length) return 1;
        return Math.max(...this.data.accounts.map((a) => Math.abs(a.balance)));
    }

    get totalExpenses(): number {
        if (!this.data?.expensesByCategory) return 0;
        return this.data.expensesByCategory.reduce((sum, e) => sum + e.total, 0);
    }

    get insights(): { icon: string; text: string; type: 'warning' | 'info' | 'danger' | 'success' }[] {
        if (!this.data) return [];
        const list: { icon: string; text: string; type: 'warning' | 'info' | 'danger' | 'success' }[] = [];

        // Top client concentration
        if (this.data.topClientsBySales?.length) {
            const top = this.data.topClientsBySales[0];
            const pct = this.data.salesThisMonth > 0 ? Math.round((top.totalSales / this.data.salesThisMonth) * 100) : 0;
            if (pct > 30) {
                list.push({ icon: '👤', text: `${top.name} representa el ${pct}% de las ventas del mes.`, type: 'info' });
            }
        }

        // Portfolio vs sales
        if (this.data.portfolioBalance > this.data.salesThisMonth) {
            list.push({ icon: '⚠️', text: `La cartera pendiente (${this.formatCurrency(this.data.portfolioBalance)}) supera las ventas del mes.`, type: 'warning' });
        }

        // Expense category concentration
        if (this.data.expensesByCategory?.length) {
            const topExp = this.data.expensesByCategory[0];
            const pct = this.totalExpenses > 0 ? Math.round((topExp.total / this.totalExpenses) * 100) : 0;
            if (pct > 30) {
                list.push({ icon: '💰', text: `Los ${topExp.categoryName.toLowerCase()} son el principal costo operativo (${pct}%).`, type: 'info' });
            }
        }

        // Negative account
        const negativeAccount = this.data.accounts?.find((a) => a.balance < 0);
        if (negativeAccount) {
            list.push({ icon: '🏦', text: `${negativeAccount.name} tiene saldo negativo desde hace 12 días.`, type: 'danger' });
        }

        // Profit warning
        if (this.data.profitThisMonth < 0) {
            list.push({ icon: '📉', text: 'La utilidad del mes es negativa.', type: 'danger' });
        }

        return list;
    }

    formatCurrency(value: number): string {
        if (value >= 1_000_000) {
            return `${this.config.currency} ${(value / 1_000_000).toFixed(1)}M`;
        }
        if (value >= 1_000) {
            return `${this.config.currency} ${(value / 1_000).toFixed(0)}K`;
        }
        return `${this.config.currency} ${value}`;
    }

    abs(value: number): number {
        return Math.abs(value);
    }

    // Sparkline SVG path generator
    sparklinePath(values: number[]): string {
        if (!values.length) return '';
        const width = 120;
        const height = 32;
        const max = Math.max(...values, 1);
        const min = Math.min(...values);
        const range = max - min || 1;
        const step = width / (values.length - 1);
        return values
            .map((v, i) => {
                const x = i * step;
                const y = height - ((v - min) / range) * height;
                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
            })
            .join(' ');
    }

    // Donut chart accumulated percent for stroke-dashoffset
    donutOffset(index: number): number {
        if (!this.data?.expensesByCategory) return 25;
        const prior = this.data.expensesByCategory.slice(0, index).reduce((s, e) => s + e.total, 0);
        return 25 - (prior / this.totalExpenses * 100);
    }

    donutPercent(value: number): number {
        if (!this.totalExpenses) return 0;
        return Math.round((value / this.totalExpenses) * 100);
    }

    // ─── Line Chart Helpers ──────────────────────────────────
    get chartMax(): number {
        const maxSales = Math.max(...this.monthlyHistory.map((m) => m.sales));
        const maxExpenses = Math.max(...this.monthlyHistory.map((m) => m.expenses));
        return Math.max(maxSales, maxExpenses, 1);
    }

    get chartYTicks(): number[] {
        const max = this.chartMax;
        const step = Math.ceil(max / 5 / 10_000_000) * 10_000_000;
        return [0, step, step * 2, step * 3, step * 4, step * 5].filter((v) => v <= max * 1.1);
    }

    linePath(values: number[]): string {
        const width = 500;
        const height = 180;
        const max = this.chartMax * 1.1;
        const len = values.length;
        const stepX = width / (len - 1);
        return values
            .map((v, i) => {
                const x = i * stepX;
                const y = height - (v / max) * height;
                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
            })
            .join(' ');
    }

    areaPath(values: number[]): string {
        const width = 500;
        const height = 180;
        const max = this.chartMax * 1.1;
        const len = values.length;
        const stepX = width / (len - 1);
        let path = values
            .map((v, i) => {
                const x = i * stepX;
                const y = height - (v / max) * height;
                return `${i === 0 ? 'M' : 'L'}${x},${y}`;
            })
            .join(' ');
        path += ` L${width},${height} L0,${height} Z`;
        return path;
    }

    profitBarY(value: number): number {
        const max = this.profitChartMax * 1.2;
        const height = 160;
        const zeroY = height / 2;
        if (value >= 0) {
            return zeroY - (value / max) * (height / 2);
        }
        return zeroY;
    }

    profitBarHeight(value: number): number {
        const max = this.profitChartMax * 1.2;
        const height = 160;
        return (Math.abs(value) / max) * (height / 2);
    }

    formatAxis(value: number): string {
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
        if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
        return `${value}`;
    }

    formatProfit(value: number): string {
        if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
        if (value >= 1_000) return `${(value / 1_000).toFixed(0)}K`;
        if (value <= -1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
        if (value <= -1_000) return `${(value / 1_000).toFixed(0)}K`;
        return `${value}`;
    }
}
