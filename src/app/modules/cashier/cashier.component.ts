import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AccountService } from '../../core/services/account/account.service';

@Component({
    selector: 'app-cashier',
    standalone: true,
    imports: [CommonModule, FormsModule],
    templateUrl: './cashier.component.html',
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
