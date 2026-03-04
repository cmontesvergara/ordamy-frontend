import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ProductService {
    private url = `${environment.middlewareBaseUrl}/api/products`;

    constructor(private http: HttpClient) { }

    list(search?: string) {
        const params = search ? `?search=${encodeURIComponent(search)}&limit=100` : '?limit=100';
        return this.http.get<any>(`${this.url}${params}`, { withCredentials: true });
    }

    create(data: any) {
        return this.http.post<any>(this.url, data, { withCredentials: true });
    }

    update(id: string, data: any) {
        return this.http.put<any>(`${this.url}/${id}`, data, { withCredentials: true });
    }
}
