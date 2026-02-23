import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { finalize } from 'rxjs';
import { LoadingService } from '../services/loading/loading.service';

export const loadingInterceptor: HttpInterceptorFn = (req, next) => {
    const loadingService = inject(LoadingService);

    // Skip loading for background requests if any (can add custom headers check later)
    loadingService.update(true);

    return next(req).pipe(
        finalize(() => {
            loadingService.update(false);
        }),
    );
};
