import { HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

export const errorInterceptor: HttpInterceptorFn = (req, next) => {
    return next(req).pipe(
        catchError((error) => {
            if (error.status === 401) {
                console.warn('⚠️ 401 Unauthorized — session may have expired');
            }

            if (error.status === 403) {
                console.warn('⚠️ 403 Forbidden — insufficient permissions');
            }

            if (error.status >= 500) {
                console.error('❌ Server error:', error.message);
            }

            return throwError(() => error);
        }),
    );
};
