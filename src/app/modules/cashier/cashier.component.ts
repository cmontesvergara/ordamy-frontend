import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/account/account.service';

@Component({
    selector: 'app-cashier',
    standalone: true,
    imports: [CommonModule, FormsModule],
    template: `
    <div class="page-header"><h1>Caja</h1></div>

    <div class="accounts-grid">
      @for (account of accounts; track account.id) {
        <div class="account-card" [class.selected]="selectedAccount?.id === account.id" (click)="selectAccount(account)">
          <div class="account-icon">🏦</div>
          <div class="account-info">
            <span class="account-name">{{ account.paymentMethod?.name }}</span>
            <span class="account-balance">$ {{ account.balance | number:'1.0-0' }}</span>
          </div>
        </div>
      }
    </div>

    <!-- Transactions -->
    <div class="card" *ngIf="selectedAccount">
      <div class="card-header">
        <h3>Transacciones — {{ selectedAccount.paymentMethod?.name }}</h3>
        <div class="date-filters">
          <input type="date" [(ngModel)]="dateFrom" (change)="loadTransactions()" />
          <input type="date" [(ngModel)]="dateTo" (change)="loadTransactions()" />
        </div>
      </div>
      <table class="data-table">
        <thead>
          <tr>
            <th>Fecha</th>
            <th>Tipo</th>
            <th>Descripción</th>
            <th class="text-right">Monto</th>
          </tr>
        </thead>
        <tbody>
          @for (t of transactions; track t.id) {
            <tr>
              <td>{{ t.transactionDate | date:'dd/MM/yyyy HH:mm' }}</td>
              <td>
                <span class="badge" [class.income]="t.type === 'INCOME'" [class.expense]="t.type === 'EXPENSE'">
                  {{ t.type === 'INCOME' ? 'Ingreso' : 'Egreso' }}
                </span>
              </td>
              <td>{{ t.description }}</td>
              <td class="text-right" [class.income-text]="t.type === 'INCOME'" [class.expense-text]="t.type === 'EXPENSE'">
                {{ t.type === 'INCOME' ? '+' : '-' }}$ {{ t.amount | number:'1.0-0' }}
              </td>
            </tr>
          }
          @if (transactions.length === 0) {
            <tr><td colspan="4" class="empty">Sin transacciones</td></tr>
          }
        </tbody>
      </table>
    </div>
  `,
    styleUrl: './cashier.component.scss',
})
export class CashierComponent implements OnInit {
    accounts: any[] = [];
    selectedAccount: any = null;
    transactions: any[] = [];
    dateFrom = '';
    dateTo = '';

    constructor(private accountService: AccountService) { }

    ngOnInit() {
        this.accountService.list().subscribe({
            next: (res: any) => {
                this.accounts = res.data;
                if (this.accounts.length > 0) this.selectAccount(this.accounts[0]);
            },
        });
    }

    selectAccount(account: any) {
        this.selectedAccount = account;
        this.loadTransactions();
    }

    loadTransactions() {
        if (!this.selectedAccount) return;
        this.accountService.getTransactions(this.selectedAccount.id, {
            from: this.dateFrom,
            to: this.dateTo,
        }).subscribe({
            next: (res: any) => { this.transactions = res.data; },
        });
    }
}
