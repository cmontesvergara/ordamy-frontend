import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';

/**
 * Guard that checks if the user has a specific permission (resource:action).
 * Usage in routes:
 *   canActivate: [hasPermissionGuard('orders', 'create')]
 */
export function hasPermissionGuard(
    resource: string,
    action: string,
): CanActivateFn {
    return () => {
        const authService = inject(AuthService);

        return authService.getSession().pipe(
            map((session: any) => {
                if (!session?.tenant?.permissions) {
                    return false;
                }

                // SuperAdmins bypass permission checks
                if (session.user?.isSuperAdmin) {
                    return true;
                }

                return session.tenant.permissions.some(
                    (p: any) => p.resource === resource && p.action === action,
                );
            }),
            catchError(() => of(false)),
        );
    };
}
