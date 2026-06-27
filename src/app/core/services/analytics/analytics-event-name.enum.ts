/**
 * Canonical analytics event names.
 *
 * Use these constants everywhere so event names don't drift between
 * components. The values are the strings sent to the analytics provider.
 */
export enum AnalyticsEventName {
    // Auth
    LoginSuccess = 'login_success',
    LoginFailed = 'login_failed',
    Logout = 'logout',

    // Navigation / layout
    TenantSwitched = 'tenant_switched',

    // Orders
    OrderCreated = 'order_created',
    OrderUpdated = 'order_updated',
    OrderStatusChanged = 'order_status_changed',
    OrderCancelled = 'order_cancelled',
    OrderPrinted = 'order_printed',

    // Payments
    PaymentRegistered = 'payment_registered',

    // Customers
    CustomerCreated = 'customer_created',
    CustomerCreatedInline = 'customer_created_inline',
    CustomerUpdated = 'customer_updated',
    CustomerDeleted = 'customer_deleted',

    // Expenses
    ExpenseCreated = 'expense_created',
    ExpenseUpdated = 'expense_updated',
    ExpenseDeleted = 'expense_deleted',
    ExpensePrinted = 'expense_printed',
    ExpenseRangePrinted = 'expense_range_printed',

    // Products
    ProductCreated = 'product_created',
    ProductUpdated = 'product_updated',

    // Materials
    MaterialCreated = 'material_created',
    MaterialUpdated = 'material_updated',
    MaterialDeleted = 'material_deleted',

    // Settings
    PaymentMethodCreated = 'payment_method_created',
    PaymentMethodUpdated = 'payment_method_updated',
    PaymentMethodDeleted = 'payment_method_deleted',
    CategoryCreated = 'category_created',
    CategoryUpdated = 'category_updated',
    CategoryDeleted = 'category_deleted',
    SupplierCreated = 'supplier_created',
    SupplierUpdated = 'supplier_updated',
    SupplierDeleted = 'supplier_deleted',
    TaxConfigCreated = 'tax_config_created',
    TaxConfigUpdated = 'tax_config_updated',
    TaxConfigDeleted = 'tax_config_deleted',
    FinancialConfigUpdated = 'financial_config_updated',

    // Reports
    ReportPrinted = 'report_printed',
    PortfolioDownloaded = 'portfolio_downloaded',
}
