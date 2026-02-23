import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

export interface Toast {
    id: number;
    title: string;
    message: string;
    type: 'success' | 'error' | 'warning' | 'info';
}

@Injectable({
    providedIn: 'root',
})
export class ToastService {
    private toastsSubject = new BehaviorSubject<Toast[]>([]);
    public toasts$ = this.toastsSubject.asObservable();
    private currentId = 0;

    show(type: Toast['type'], title: string, message: string, durationMs = 5000) {
        const id = this.currentId++;
        const newToast: Toast = { id, title, message, type };

        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next([...currentToasts, newToast]);

        setTimeout(() => this.remove(id), durationMs);
    }

    error(title: string, message: string) {
        this.show('error', title, message);
    }

    warning(title: string, message: string) {
        this.show('warning', title, message);
    }

    success(title: string, message: string) {
        this.show('success', title, message);
    }

    remove(id: number) {
        const currentToasts = this.toastsSubject.value;
        this.toastsSubject.next(currentToasts.filter((t) => t.id !== id));
    }
}
