import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { SessionService } from '../services/session/session.service';
import { ToastService } from '../services/toast/toast.service';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    const toastService = inject(ToastService);
    const sessionService = inject(SessionService);

    return next(req).pipe(
        catchError((error) => {
            if (error.status === 401) {
                sessionService.clearSession();
                toastService.warning('Sesión expirada', 'Por favor, inicia sesión nuevamente.');
            } else if (error.status === 403) {
                toastService.warning('Acceso denegado', 'No tienes permisos para realizar esta acción.');
            } else if (error.status >= 500) {
                toastService.error('Error del servidor', 'Ocurrió un error inesperado. Intenta de nuevo.');
            } else if (error.status === 400 || error.status === 404) {
                const msg = error.error?.message || 'La solicitud no pudo ser procesada.';
                toastService.error('Error', msg);
            }

            return throwError(() => error);
        }),
    );
};
