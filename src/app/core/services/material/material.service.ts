import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { environment } from '../../../../environments/environment';

@Injectable({ providedIn: 'root' })
export class MaterialService {
    private url = `${environment.middlewareBaseUrl}/api/materials`;

    constructor(private http: HttpClient) { }

    list(search?: string) {
        const params = search ? `?search=${encodeURIComponent(search)}&limit=100` : '?limit=100';
        return this.http.get<any>(`${this.url}${params}`, { withCredentials: true });
    }

    /** Silent list — does not trigger the global loader */
    listSilent(search?: string) {
        const params = search ? `?search=${encodeURIComponent(search)}&limit=100` : '?limit=100';
        const headers = new HttpHeaders({ 'X-Skip-Loading': '1' });
        return this.http.get<any>(`${this.url}${params}`, { withCredentials: true, headers });
    }

    create(data: any) {
        return this.http.post<any>(this.url, data, { withCredentials: true });
    }

    update(id: string, data: any) {
        return this.http.put<any>(`${this.url}/${id}`, data, { withCredentials: true });
    }

    delete(id: string) {
        return this.http.delete<any>(`${this.url}/${id}`, { withCredentials: true });
    }
}
