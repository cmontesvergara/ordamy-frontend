import { Component, EventEmitter, Input, OnDestroy, OnInit, Output } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import { Tenant, TenantService } from '../../../core/services/tenant/tenant.service';

export interface FrequentTenant {
  id: string;
  name: string;
  slug: string;
  color?: string;
}

@Component({
  selector: 'app-tenant-search',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tenant-search.component.html',
  styleUrls: ['./tenant-search.component.scss']
})
export class TenantSearchComponent implements OnInit, OnDestroy {
  @Input() placeholder = 'Busca por nombre del negocio...';
  @Input() showFrequentSearches = true;
  @Input() frequentSearches: FrequentTenant[] = [];
  @Input() searchDelay = 300;
  @Input() minSearchLength = 2;
  
  @Output() tenantSelected = new EventEmitter<Tenant | FrequentTenant>();
  @Output() searchCleared = new EventEmitter<void>();

  searchQuery = '';
  searchResults: Tenant[] = [];
  isSearching = false;
  showResults = false;
  searchError = '';
  
  private searchSubject = new Subject<string>();
  private subscription: Subscription | null = null;

  constructor(private tenantService: TenantService) {}

  ngOnInit(): void {
    this.subscription = this.searchSubject.pipe(
      debounceTime(this.searchDelay),
      distinctUntilChanged(),
      switchMap((query: string) => {
        if (query.length < this.minSearchLength) {
          this.showResults = false;
          this.searchResults = [];
          return [];
        }
        this.isSearching = true;
        this.showResults = true;
        return this.tenantService.searchTenants(query);
      })
    ).subscribe({
      next: (results) => {
        this.searchResults = results || [];
        this.isSearching = false;
        this.searchError = '';
      },
      error: () => {
        this.searchResults = [];
        this.isSearching = false;
        this.searchError = 'Error al buscar. Intenta de nuevo.';
      }
    });
  }

  ngOnDestroy(): void {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  onSearchInput(): void {
    this.searchSubject.next(this.searchQuery);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.searchResults = [];
    this.showResults = false;
    this.searchError = '';
    this.searchCleared.emit();
  }

  selectTenant(tenant: Tenant | FrequentTenant): void {
    this.tenantSelected.emit(tenant);
  }

  getInitials(name: string): string {
    return name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('');
  }

  trackBySlug(index: number, tenant: FrequentTenant): string {
    return tenant.slug;
  }
}
