import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class PaymentService {
    private url = `${environment.authApiUrl}/api/payments`;

    constructor(private http: HttpClient) { }

    list(params: any = {}) {
        let httpParams = new HttpParams();
        Object.keys(params).forEach((key) => {
            if (params[key] !== undefined && params[key] !== null && params[key] !== '') {
                httpParams = httpParams.set(key, params[key]);
            }
        });
        return this.http.get<any>(this.url, { params: httpParams, withCredentials: true });
    }

    create(data: any) {
        return this.http.post<any>(this.url, data, { withCredentials: true });
    }
}
