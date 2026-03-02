import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AppConfigService {
    private url = `${environment.authApiUrl}/api/settings/financial`;

    currency$ = new BehaviorSubject<string>('$');
    timezone$ = new BehaviorSubject<string>('America/Bogota');

    get currency(): string { return this.currency$.value; }
    get timezone(): string { return this.timezone$.value; }

    constructor(private http: HttpClient) { }

    load(): void {
        this.http.get<any>(this.url, { withCredentials: true }).subscribe({
            next: (res: any) => {
                if (res.data) {
                    this.currency$.next(res.data.currency || '$');
                    this.timezone$.next(res.data.timezone || 'America/Bogota');
                }
            },
        });
    }

    /** Call after saving financial config to refresh */
    refresh(): void {
        this.load();
    }
}
