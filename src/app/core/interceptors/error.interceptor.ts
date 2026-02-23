import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { ToastService } from '../services/toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toastService = inject(ToastService);

    return next(req).pipe(
        catchError((error) => {
            if (error.status === 401) {
                toastService.warning('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
                console.warn('⚠️ 401 Unauthorized — session may have expired');
            } else if (error.status === 403) {
                toastService.warning('Acceso denegado', 'No tienes permisos para realizar esta acción.');
                console.warn('⚠️ 403 Forbidden — insufficient permissions');
            } else if (error.status >= 500) {
                toastService.error('Error del servidor', 'Ocurrió un error inesperado. Intenta de nuevo.');
                console.error('❌ Server error:', error.message);
            } else if (error.status === 400 || error.status === 404) {
                const msg = error.error?.message || 'La solicitud no pudo ser procesada.';
                toastService.error('Error', msg);
            }

            return throwError(() => error);
        }),
    );
};
