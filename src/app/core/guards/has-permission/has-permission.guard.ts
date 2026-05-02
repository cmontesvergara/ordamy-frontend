import { inject } from '@angular/core';
import { CanActivateFn } from '@angular/router';
import { SessionService } from '../../services/session/session.service';
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
        const sessionService = inject(SessionService);
        const toastService = inject(ToastService);

        const permissions = sessionService.getPermissions();
        console.log(`[HasPermissionGuard] Verificando permiso para ${resource}:${action}. Permisos del usuario:`, permissions);
        //const user = sessionService.getUser();

        if (!permissions) {
            toastService.error('Autenticación', 'No hay datos de sesión o permisos disponibles.');
            return false;
        }

        const hasAccess = permissions.some(
            (p) => p.resource === resource && p.action === action,
        );

        if (!hasAccess) {
            toastService.warning('Acceso Restringido', `No tienes permiso para acceder a esta sección (${resource}:${action}).`);
        }

        return hasAccess;
    };
}
