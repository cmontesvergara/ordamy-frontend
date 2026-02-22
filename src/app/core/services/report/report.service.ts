import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ReportService {
    private url = `${environment.authApiUrl}/api/reports`;

    constructor(private http: HttpClient) { }

    getDashboard() {
        return this.http.get<any>(`${this.url}/dashboard`, { withCredentials: true });
    }

    getPortfolio() {
        return this.http.get<any>(`${this.url}/portfolio`, { withCredentials: true });
    }

    getDaily(date?: string) {
        let params = new HttpParams();
        if (date) params = params.set('date', date);
        return this.http.get<any>(`${this.url}/daily`, { params, withCredentials: true });
    }

    getMonthly(year?: number, month?: number) {
        let params = new HttpParams();
        if (year) params = params.set('year', year.toString());
        if (month) params = params.set('month', month.toString());
        return this.http.get<any>(`${this.url}/monthly`, { params, withCredentials: true });
    }
}
