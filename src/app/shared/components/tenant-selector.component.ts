import { Component, Input, Output, EventEmitter } from '@angular/core';


export interface Tenant {
  id: string;
  name: string;
  slug: string;
  role: string;
  apps?: string[];
}

@Component({
    selector: 'app-tenant-selector',
    imports: [],
    template: `
    @if (tenants.length > 0) {
      <div class="relative">
        <!-- Botón del Tenant Actual -->
        <button
          (click)="toggleDropdown($event)"
          class="flex items-center gap-2 rounded-full bg-indigo-50 px-3 py-1.5 text-xs font-semibold text-indigo-600 hover:bg-indigo-100 transition-colors duration-200"
          [class.cursor-pointer]="tenants.length > 1"
          [class.cursor-default]="tenants.length === 1">
          <span class="max-w-[150px] truncate">{{ currentTenant?.name || tenants[0]?.name }}</span>
          @if (tenants.length > 1) {
            <svg
              class="w-3 h-3 transition-transform duration-200"
              [class.rotate-180]="dropdownOpen"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
            </svg>
          }
        </button>
        <!-- Dropdown Multi-Tenant -->
        @if (dropdownOpen && tenants.length > 1) {
          <div
            class="absolute right-0 mt-2 w-64 rounded-lg bg-white shadow-lg border border-slate-200 py-1 z-50 animate-fade-in"
            (click)="$event.stopPropagation()">
            <!-- Header -->
            <div class="px-3 py-2 text-xs font-medium text-slate-500 border-b border-slate-100 bg-slate-50 rounded-t-lg">
              Seleccionar empresa
            </div>
            <!-- Lista de Tenants -->
            <div class="max-h-60 overflow-y-auto">
              @for (tenant of tenants; track tenant) {
                <button
                  (click)="onSelectTenant(tenant)"
                  class="w-full text-left px-3 py-2.5 text-sm hover:bg-slate-50 flex items-center justify-between group transition-colors duration-150"
                  [class.bg-indigo-50]="tenant.id === currentTenant?.id">
                  <div class="flex items-center gap-3">
                    <!-- Indicador de estado -->
                    <span
                      class="w-2 h-2 rounded-full flex-shrink-0"
                      [class.bg-emerald-500]="tenant.id === currentTenant?.id"
                      [class.bg-slate-300]="tenant.id !== currentTenant?.id">
                    </span>
                    <!-- Nombre del tenant -->
                    <div class="flex flex-col">
                      <span
                        class="font-medium text-slate-700 group-hover:text-slate-900"
                        [class.text-indigo-900]="tenant.id === currentTenant?.id">
                        {{ tenant.name }}
                      </span>
                      <span class="text-xs text-slate-400">{{ tenant.role }}</span>
                    </div>
                  </div>
                  <!-- Badge Activo -->
                  @if (tenant.id === currentTenant?.id) {
                    <span
                      class="text-indigo-600 text-[10px] font-semibold bg-indigo-100 px-2 py-0.5 rounded-full">
                      Activo
                    </span>
                  }
                </button>
              }
            </div>
            <!-- Footer opcional -->
            @if (showFooter) {
              <div class="px-3 py-2 text-xs text-slate-400 border-t border-slate-100 bg-slate-50 rounded-b-lg">
                {{ tenants.length }} empresas disponibles
              </div>
            }
          </div>
        }
      </div>
    }
    `,
    styles: [`
    :host {
      display: block;
    }
    
    @keyframes fade-in {
      from {
        opacity: 0;
        transform: translateY(-4px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }
    
    .animate-fade-in {
      animation: fade-in 150ms ease-out;
    }
    
    /* Scrollbar styling for dropdown */
    .overflow-y-auto::-webkit-scrollbar {
      width: 4px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-track {
      background: transparent;
    }
    
    .overflow-y-auto::-webkit-scrollbar-thumb {
      background-color: #cbd5e1;
      border-radius: 2px;
    }
    
    .overflow-y-auto::-webkit-scrollbar-thumb:hover {
      background-color: #94a3b8;
    }
  `]
})
export class TenantSelectorComponent {
  @Input() tenants: Tenant[] = [];
  @Input() currentTenant: Tenant | null = null;
  @Input() showFooter = false;
  
  @Output() tenantSelected = new EventEmitter<Tenant>();
  @Output() dropdownToggled = new EventEmitter<boolean>();
  
  dropdownOpen = false;
  
  toggleDropdown(event: Event): void {
    if (this.tenants.length <= 1) return;
    
    event.stopPropagation();
    this.dropdownOpen = !this.dropdownOpen;
    this.dropdownToggled.emit(this.dropdownOpen);
  }
  
  onSelectTenant(tenant: Tenant): void {
    if (tenant.id === this.currentTenant?.id) {
      this.dropdownOpen = false;
      return;
    }
    
    this.currentTenant = tenant;
    this.dropdownOpen = false;
    this.tenantSelected.emit(tenant);
  }
  
  closeDropdown(): void {
    this.dropdownOpen = false;
  }
}
