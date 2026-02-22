import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class AccountService {
    private url = `${environment.authApiUrl}/api/accounts`;

    constructor(private http: HttpClient) { }

    list() {
        return this.http.get<any>(this.url, { withCredentials: true });
    }

    getTransactions(accountId: string, params: any = {}) {
        let httpParams = new HttpParams();
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                httpParams = httpParams.set(key, params[key]);
            }
        });
        return this.http.get<any>(`${this.url}/${accountId}/transactions`, {
            params: httpParams,
            withCredentials: true,
        });
    }
}
