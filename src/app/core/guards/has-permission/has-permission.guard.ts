import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { catchError, map, of } from 'rxjs';
import { AuthService } from '../../services/auth/auth.service';
import { ToastService } from '../../services/toast/toast.service';

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
        const toastService = inject(ToastService);

        return authService.getSession().pipe(
            map((session: any) => {
                if (!session?.tenant?.permissions) {
                    toastService.error('Autenticación', 'No hay datos de sesión o permisos disponibles.');
                    return false;
                }

                // SuperAdmins bypass permission checks
                if (session.user?.isSuperAdmin) {
                    return true;
                }

                const hasAccess = session.tenant.permissions.some(
                    (p: any) => p.resource === resource && p.action === action,
                );

                if (!hasAccess) {
                    toastService.warning('Acceso Restringido', `No tienes permiso para acceder a esta sección (${resource}:${action}).`);
                }

                return hasAccess;
            }),
            catchError(() => of(false)),
        );
    };
}
