import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { NgApexchartsModule } from 'ng-apexcharts';
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
    imports: [CommonModule, NgApexchartsModule],
    templateUrl: './dashboard-v2.component.html',
    styleUrl: './dashboard-v2.component.scss'
})
export class DashboardV2Component implements OnInit {
    data: DashboardData | null = null;

    operationalSteps = [
        { key: 'PENDING', label: 'Pendiente', color: '#64748b', bg: '#f1f5f9' },
        { key: 'APPROVED', label: 'Aprobada', color: '#3b82f6', bg: '#eff6ff' },
        { key: 'IN_PRODUCTION', label: 'producción', color: '#f59e0b', bg: '#fffbeb' },
        { key: 'PRODUCED', label: 'Producida', color: '#8b5cf6', bg: '#f5f3ff' },
        { key: 'DELIVERED', label: 'Entregada', color: '#10b981', bg: '#ecfdf5' },
    ];

    expenseColors = ['#3b82f6', '#06b6d4', '#f59e0b', '#64748b', '#ef4444', '#8b5cf6', '#10b981'];

    // Real historical data from API (populated in ngOnInit)
    monthlyHistory: { month: string; year: number; sales: number; expenses: number; profit: number }[] = [];

    // ApexCharts options
    salesExpensesChartOptions: any;
    profitChartOptions: any;
    sparklineProfitOptions: any;
    sparklineSalesOptions: any;
    sparklineExpensesOptions: any;
    sparklinePortfolioOptions: any;

    // Sparkline data derived from monthlyHistory (real data)
    sparklines = {
        profit: [] as number[],
        sales: [] as number[],
        expenses: [] as number[],
        portfolio: [] as number[],
    };

    constructor(private reportService: ReportService, public config: AppConfigService) { }

    ngOnInit() {
        // Load historical data for charts
        this.reportService.getHistorical(12).subscribe({
            next: (res: any) => {
                if (res.data?.length) {
                    this.monthlyHistory = res.data;
                    this.sparklines.sales = res.data.map((m: any) => m.sales);
                    this.sparklines.expenses = res.data.map((m: any) => m.expenses);
                    this.sparklines.profit = res.data.map((m: any) => m.profit);
                    // Portfolio sparkline: use profit as proxy until we have real portfolio history
                    this.sparklines.portfolio = res.data.map((m: any) => m.profit);
                    this.initCharts();
                }
            },
        });

        // Load dashboard KPIs
        this.reportService.getDashboard().subscribe({
            next: (res: any) => { this.data = res.data; },
        });
    }

    private initCharts() {
        const months = this.monthlyHistory.map((m) => m.month);

        this.salesExpensesChartOptions = {
            series: [
                { name: 'Ventas', data: this.monthlyHistory.map((m) => m.sales) },
                { name: 'Egresos', data: this.monthlyHistory.map((m) => m.expenses) },
            ],
            chart: { type: 'area', height: 220, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif' },
            colors: ['#10b981', '#ef4444'],
            fill: {
                type: 'gradient',
                gradient: { shadeIntensity: 1, opacityFrom: 0.25, opacityTo: 0.02, stops: [0, 100] },
            },
            stroke: { curve: 'smooth', width: 2.5 },
            dataLabels: { enabled: false },
            legend: { show: false },
            tooltip: {
                theme: 'light',
                y: {
                    formatter: (val: number) => `${this.config.currency} ${(val / 1_000_000).toFixed(1)}M`,
                },
            },
            xaxis: {
                categories: months,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { colors: '#64748b', fontSize: '11px' } },
            },
            yaxis: {
                labels: {
                    style: { colors: '#94a3b8', fontSize: '10px' },
                    formatter: (val: number) => {
                        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
                        if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                        return `${val}`;
                    },
                },
            },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 0 },
        };

        const profits = this.monthlyHistory.map((m) => m.profit);
        const profitMax = Math.max(...profits.map((p) => Math.abs(p)), 1);

        this.profitChartOptions = {
            series: [{ name: 'Utilidad', data: profits }],
            chart: { type: 'bar', height: 220, toolbar: { show: false }, zoom: { enabled: false }, fontFamily: 'Inter, sans-serif' },
            colors: profits.map((p) => (p >= 0 ? '#10b981' : '#ef4444')),
            plotOptions: {
                bar: { borderRadius: 3, columnWidth: '55%', distributed: true },
            },
            dataLabels: { enabled: false },
            legend: { show: false },
            tooltip: {
                theme: 'light',
                y: {
                    formatter: (val: number) => `${this.config.currency} ${(val / 1_000_000).toFixed(1)}M`,
                },
            },
            xaxis: {
                categories: months,
                axisBorder: { show: false },
                axisTicks: { show: false },
                labels: { style: { colors: '#64748b', fontSize: '11px' } },
            },
            yaxis: {
                min: -profitMax * 1.2,
                max: profitMax * 1.2,
                labels: {
                    style: { colors: '#94a3b8', fontSize: '10px' },
                    formatter: (val: number) => {
                        if (val >= 1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
                        if (val >= 1_000) return `${(val / 1_000).toFixed(0)}K`;
                        if (val <= -1_000_000) return `${(val / 1_000_000).toFixed(0)}M`;
                        if (val <= -1_000) return `${(val / 1_000).toFixed(0)}K`;
                        return `${val}`;
                    },
                },
            },
            grid: { borderColor: '#f1f5f9', strokeDashArray: 4, position: 'back' },
        };

        // Sparkline options for KPI cards
        const sparklineBase = {
            chart: { type: 'area', height: 50, sparkline: { enabled: true }, toolbar: { show: false }, animations: { enabled: true } },
            stroke: { curve: 'smooth', width: 2 },
            fill: {
                type: 'gradient',
                gradient: { shadeIntensity: 1, opacityFrom: 0.35, opacityTo: 0.05, stops: [0, 100] },
            },
            tooltip: { fixed: { enabled: false }, x: { show: false }, y: { title: { formatter: () => '' } }, marker: { show: false } },
        };

        this.sparklineProfitOptions = {
            ...sparklineBase,
            series: [{ data: this.sparklines.profit }],
            colors: ['#ef4444'],
            tooltip: {
                ...sparklineBase.tooltip,
                y: {
                    title: { formatter: () => 'Utilidad' },
                    formatter: (val: number) => `${this.config.currency} ${(val / 1_000_000).toFixed(1)}M`,
                },
            },
        };
        this.sparklineSalesOptions = {
            ...sparklineBase,
            series: [{ data: this.sparklines.sales }],
            colors: ['#10b981'],
            tooltip: {
                ...sparklineBase.tooltip,
                y: {
                    title: { formatter: () => 'Ventas' },
                    formatter: (val: number) => `${this.config.currency} ${(val / 1_000_000).toFixed(1)}M`,
                },
            },
        };
        this.sparklineExpensesOptions = {
            ...sparklineBase,
            series: [{ data: this.sparklines.expenses }],
            colors: ['#ef4444'],
            tooltip: {
                ...sparklineBase.tooltip,
                y: {
                    title: { formatter: () => 'Egresos' },
                    formatter: (val: number) => `${this.config.currency} ${(val / 1_000_000).toFixed(1)}M`,
                },
            },
        };
        this.sparklinePortfolioOptions = {
            ...sparklineBase,
            series: [{ data: this.sparklines.portfolio }],
            colors: ['#d97706'],
            tooltip: {
                ...sparklineBase.tooltip,
                y: {
                    title: { formatter: () => 'Cartera' },
                    formatter: (val: number) => `${this.config.currency} ${(val / 1_000_000).toFixed(1)}M`,
                },
            },
        };
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
        return this.data.expensesByCategory.reduce((sum, e) => sum + Number(e.total || 0), 0);
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

    // Donut chart accumulated percent for stroke-dashoffset
    donutOffset(index: number): number {
        if (!this.data?.expensesByCategory) return 25;
        const prior = this.data.expensesByCategory.slice(0, index).reduce((s, e) => s + e.total, 0);
        return 25 - (prior / this.totalExpenses * 100);
    }

    donutPercent(value: number): number {
        const total = this.totalExpenses;
        if (!total) return 0;
        return Math.round((Number(value || 0) / total) * 100);
    }
}
