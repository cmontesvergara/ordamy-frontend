# Integration — Ordamy Frontend

## Autenticación

El frontend utiliza `SessionService` para gestionar la autenticación con BigSo SSO. El servicio maneja el refresh de tokens, almacenamiento de sesión y redirección al portal SSO cuando es necesario.

### SessionService

El servicio core de sesión (`core/services/session/session.service.ts`) proporciona:

```typescript
@Injectable({ providedIn: 'root' })
export class SessionService {
  isDefined(): boolean;           // Verifica si hay sesión activa
  refreshTokens(): Observable<any>;  // Renueva tokens de acceso
  getSession(): Observable<any>;     // Obtiene datos de sesión del usuario
  setupSession(session: any): void;  // Configura sesión en memoria
  logout(): void;                  // Cierra sesión
}
```

### Flujo de Autenticación

1. Usuario accede a ruta protegida
2. `isLoggedGuard` verifica `sessionService.isDefined()`
3. Si no hay sesión, intenta `refreshTokens()` y `getSession()`
4. Si falla, redirige a portal SSO
5. Tras login exitoso, SSO redirige a `/auth/callback`
6. Callback procesa tokens y llama `setupSession()`
7. Usuario redirigido a la ruta original

### HttpClient Configuración

Es crucial configurar `withCredentials` para enviar cookies:

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([
        authInterceptor,
        errorInterceptor
      ]),
      withFetch()
    )
  ]
};
```

## Servicios de API

### CustomerService

```typescript
@Injectable({ providedIn: 'root' })
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getCustomers(params: { search?: string, page?: number, limit?: number }) {
    return this.http.get(`${this.apiUrl}/customers`, { params });
  }

  getCustomer(id: string) {
    return this.http.get(`${this.apiUrl}/customers/${id}`);
  }

  createCustomer(data: CustomerInput) {
    return this.http.post(`${this.apiUrl}/customers`, data);
  }

  updateCustomer(id: string, data: Partial<CustomerInput>) {
    return this.http.put(`${this.apiUrl}/customers/${id}`, data);
  }

  deleteCustomer(id: string) {
    return this.http.delete(`${this.apiUrl}/customers/${id}`);
  }
}
```

### OrderService

```typescript
@Injectable({ providedIn: 'root' })
export class OrderService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getOrders(filters: OrderFilters) {
    return this.http.get(`${this.apiUrl}/orders`, { params: filters });
  }

  getOrder(id: string) {
    return this.http.get(`${this.apiUrl}/orders/${id}`);
  }

  createOrder(data: OrderInput) {
    return this.http.post(`${this.apiUrl}/orders`, data);
  }

  updateOrder(id: string, data: Partial<OrderInput>) {
    return this.http.put(`${this.apiUrl}/orders/${id}`, data);
  }

  cancelOrder(id: string, reason: string) {
    return this.http.put(`${this.apiUrl}/orders/${id}/cancel`, { reason });
  }

  updateOperationalStatus(id: string, status: OperationalStatus) {
    return this.http.put(
      `${this.apiUrl}/orders/${id}/operational-status`,
      { operationalStatus: status }
    );
  }

  getOrderPdf(id: string, mode: 'production' | 'customer') {
    return this.http.get(
      `${this.apiUrl}/orders/${id}/pdf?mode=${mode}`,
      { responseType: 'blob' }
    );
  }
}
```

### ExpenseService

```typescript
@Injectable({ providedIn: 'root' })
export class ExpenseService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getExpenses(filters: ExpenseFilters) {
    return this.http.get(`${this.apiUrl}/expenses`, { params: filters });
  }

  getExpense(id: string) {
    return this.http.get(`${this.apiUrl}/expenses/${id}`);
  }

  createExpenseWithFiles(expenseData: ExpenseInput, files: File[]) {
    const formData = new FormData();
    
    Object.entries(expenseData).forEach(([key, value]) => {
      if (value !== undefined) formData.append(key, String(value));
    });
    
    files.forEach(file => formData.append('files', file));

    return this.http.post(`${this.apiUrl}/expenses`, formData);
  }

  uploadAttachment(expenseId: string, file: File) {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post(
      `${this.apiUrl}/expenses/${expenseId}/attachments`,
      formData
    );
  }

  getAttachments(expenseId: string) {
    return this.http.get(`${this.apiUrl}/expenses/${expenseId}/attachments`);
  }
}
```

### ReportService

```typescript
@Injectable({ providedIn: 'root' })
export class ReportService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  getDailyReport(date?: string) {
    return this.http.get(`${this.apiUrl}/reports/daily`, {
      params: date ? { date } : undefined
    });
  }

  getMonthlyReport(year: number, month: number) {
    return this.http.get(`${this.apiUrl}/reports/monthly`, {
      params: { year, month }
    });
  }

  getPortfolioReport() {
    return this.http.get(`${this.apiUrl}/reports/portfolio`);
  }
}
```

## Ejemplos de Uso en Componentes

### Lista de Clientes

```typescript
@Component({
  selector: 'app-customers',
  template: `
    <div class="p-6">
      <input 
        type="search"
        [formControl]="searchControl"
        placeholder="Buscar clientes..."
        class="w-full p-2 border rounded"
      />
      
      <table class="w-full mt-4">
        <thead>
          <tr>
            <th>Nombre</th>
            <th>Identificación</th>
            <th>Teléfono</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let customer of customers()">
            <td>{{ customer.name }}</td>
            <td>{{ customer.identification }}</td>
            <td>{{ customer.phone }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `
})
export class CustomersComponent {
  private customerService = inject(CustomerService);
  searchControl = new FormControl('');
  
  customers = signal<Customer[]>([]);
  total = signal(0);
  
  constructor() {
    this.loadCustomers();
    
    this.searchControl.valueChanges.pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => this.customerService.getCustomers({ search: term || undefined }))
    ).subscribe(response => {
      this.customers.set(response.data);
      this.total.set(response.total);
    });
  }
  
  loadCustomers() {
    this.customerService.getCustomers({}).subscribe(response => {
      this.customers.set(response.data);
    });
  }
}
```

### Crear Orden con Items

```typescript
@Component({
  selector: 'app-order-create',
  template: `
    <form [formGroup]="orderForm" (ngSubmit)="onSubmit()">
      <select formControlName="customerId">
        <option *ngFor="let c of customers" [value]="c.id">
          {{ c.name }}
        </option>
      </select>
      
      <div formArrayName="items">
        <div *ngFor="let item of items.controls; let i=index" [formGroupName]="i">
          <input formControlName="description" placeholder="Descripción" />
          <input formControlName="quantity" type="number" />
          <input formControlName="unitPrice" type="number" />
          <button type="button" (click)="removeItem(i)">Eliminar</button>
        </div>
      </div>
      
      <button type="button" (click)="addItem()">Agregar Item</button>
      <button type="submit" [disabled]="orderForm.invalid">Crear Orden</button>
    </form>
  `
})
export class OrderCreateComponent {
  private orderService = inject(OrderService);
  private router = inject(Router);
  
  orderForm = new FormGroup({
    customerId: new FormControl('', Validators.required),
    items: new FormArray([])
  });
  
  get items() {
    return this.orderForm.get('items') as FormArray;
  }
  
  addItem() {
    this.items.push(new FormGroup({
      description: new FormControl('', Validators.required),
      quantity: new FormControl(1, [Validators.required, Validators.min(1)]),
      unitPrice: new FormControl(0, Validators.required)
    }));
  }
  
  removeItem(index: number) {
    this.items.removeAt(index);
  }
  
  onSubmit() {
    if (this.orderForm.invalid) return;
    
    this.orderService.createOrder(this.orderForm.value).subscribe({
      next: (response) => {
        this.router.navigate(['/orders', response.data.id]);
      },
      error: (err) => {
        console.error('Error creating order:', err);
      }
    });
  }
}
```

### Subir Archivos (Egreso)

```typescript
@Component({
  selector: 'app-expense-create',
  template: `
    <form [formGroup]="expenseForm" (ngSubmit)="onSubmit()">
      <input formControlName="description" placeholder="Descripción" />
      <input formControlName="amount" type="number" placeholder="Monto" />
      
      <input 
        type="file" 
        multiple 
        (change)="onFilesSelected($event)"
        accept=".pdf,.jpg,.png"
      />
      
      <div *ngIf="selectedFiles.length > 0">
        <p *ngFor="let file of selectedFiles">{{ file.name }}</p>
      </div>
      
      <button type="submit">Guardar Egreso</button>
    </form>
    
    <div *ngIf="warnings.length > 0" class="alert-warning">
      <p>Algunos archivos no se pudieron subir:</p>
      <ul>
        <li *ngFor="let w of warnings">{{ w.fileName }}: {{ w.error }}</li>
      </ul>
    </div>
  `
})
export class ExpenseCreateComponent {
  private expenseService = inject(ExpenseService);
  
  expenseForm = new FormGroup({
    description: new FormControl('', Validators.required),
    amount: new FormControl(0, Validators.required),
    paymentMethodId: new FormControl('', Validators.required),
    categoryId: new FormControl('', Validators.required)
  });
  
  selectedFiles: File[] = [];
  warnings: Array<{ fileName: string; error: string }> = [];
  
  onFilesSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      this.selectedFiles = Array.from(input.files).slice(0, 5);
    }
  }
  
  onSubmit() {
    if (this.expenseForm.invalid) return;
    
    this.expenseService.createExpenseWithFiles(
      this.expenseForm.value,
      this.selectedFiles
    ).subscribe({
      next: (response) => {
        if (response.warnings?.failed?.length > 0) {
          this.warnings = response.warnings.failed;
        }
        // Navegar al detalle
      },
      error: (err) => {
        console.error('Error:', err);
      }
    });
  }
}
```

## Manejo de Errores

### Interceptor Global de Errores

```typescript
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  const router = inject(Router);
  const sessionService = inject(SessionService);
  
  return next(req).pipe(
    catchError(error => {
      if (error.status === 401) {
        // Sesión expirada
        sessionService.logout();
        router.navigate(['/']);
      } else if (error.status === 403) {
        // Sin permisos
        router.navigate(['/unauthorized']);
      } else if (error.status === 409) {
        // Conflicto (duplicado)
        return throwError(() => new Error('El recurso ya existe'));
      }
      return throwError(() => error);
    })
  );
};
```

## Permisos RBAC

### Verificar Permisos en Componentes

```typescript
@Component({...})
export class OrderCreateComponent {
  private sessionService = inject(SessionService);
  
  canCreateOrder = computed(() => {
    const permissions = this.sessionService.permissions();
    return permissions.includes('orders:create');
  });
  
  canApplyDiscount = computed(() => {
    const permissions = this.sessionService.permissions();
    return permissions.includes('orders:apply_discount');
  });
}
```

### Ocultar Elementos por Permisos

```html
<!-- Solo mostrar si tiene permiso -->
<button *ngIf="canCreateOrder()" (click)="createOrder()">
  Nueva Orden
</button>

<input 
  *ngIf="canApplyDiscount()"
  type="number" 
  formControlName="discount"
  placeholder="Descuento"
/>
```

## Rate Limiting

El middleware implementa rate limiting. El frontend maneja esto:

```typescript
this.orderService.createOrder(data).subscribe({
  next: (response) => { /* éxito */ },
  error: (err) => {
    if (err.status === 429) {
      // Demasiadas solicitudes
      this.toastService.show('Por favor espera un momento antes de intentar nuevamente');
    }
  }
});
```
