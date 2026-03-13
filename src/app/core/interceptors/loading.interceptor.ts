import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const loadingService = inject(LoadingService);

    // Skip loading for background requests marked with X-Skip-Loading header
    if (req.headers.has('X-Skip-Loading')) {
        const cleaned = req.clone({ headers: req.headers.delete('X-Skip-Loading') });
        return next(cleaned);
    }

    loadingService.update(true);

    return next(req).pipe(
        finalize(() => {
            loadingService.update(false);
        }),
    );
};
