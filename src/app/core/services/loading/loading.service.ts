import { Injectable } from '@angular/core';

@Injectable({
    providedIn: 'root',
})
export class LoadingService {
    public loading: boolean = false;

    is() {
        return this.loading;
    }

    update(value: boolean) {
        this.loading = value;
    }
}
