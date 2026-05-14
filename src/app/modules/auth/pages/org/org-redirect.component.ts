import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { BigsoAuth } from '@bigso/auth-sdk/browser';
import { environment } from '../../../../../environments/environment';
import { Tenant, TenantService } from '../../../../core/services/tenant/tenant.service';

@Component({
    selector: 'app-org-welcome',
    standalone: true,
    imports: [CommonModule],
    template: `
        <div class="min-h-screen flex flex-col" style="background-color: #fdf6ef;">
            
            <!-- Top Navigation -->
            <header class="w-full py-6 px-8">
                <div class="flex items-center justify-between max-w-7xl mx-auto">
                    <button (click)="goBack()" class="flex items-center gap-2 text-slate-600 hover:text-slate-900 transition-colors bg-transparent border-none cursor-pointer">
                        <svg class="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                            <path stroke-linecap="round" stroke-linejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
                        </svg>
                        <span class="text-sm font-medium">Volver</span>
                    </button>
                </div>
            </header>

            <!-- Loading State -->
            @if (isLoading) {
                <main class="flex-1 flex items-center justify-center px-4">
                    <div class="text-center">
                        <div class="mb-6">
                            <svg class="animate-spin h-10 w-10 mx-auto" style="color: #e05a20;" fill="none" viewBox="0 0 24 24">
                                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-slate-900 mb-2">Cargando...</h2>
                        <p class="text-sm text-slate-600">Buscando información del negocio</p>
                    </div>
                </main>
            }

            <!-- Error State -->
            @if (error && !isLoading) {
                <main class="flex-1 flex items-center justify-center px-4">
                    <div class="text-center max-w-md">
                        <div class="mb-6 inline-flex items-center justify-center w-16 h-16 rounded-full" style="background-color: rgba(244, 63, 94, 0.1);">
                            <svg class="h-8 w-8" style="color: #f43f5e;" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                <path stroke-linecap="round" stroke-linejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                            </svg>
                        </div>
                        <h2 class="text-xl font-semibold text-slate-900 mb-2">Negocio no encontrado</h2>
                        <p class="text-sm text-slate-600 mb-6">{{ error }}</p>
                        <button (click)="goBack()" class="inline-flex items-center justify-center rounded-md px-6 py-3 text-base font-semibold text-white transition-all duration-150" style="background-color: #e05a20;">
                            Volver a la búsqueda
                        </button>
                    </div>
                </main>
            }

            <!-- Main Content -->
            @if (tenant && !isLoading && !error) {
                <main class="flex-1 flex items-center justify-center px-4 py-12">
                    <div class="w-full max-w-2xl text-center">
                        
                        <!-- Tenant Avatar -->
                        <div class="mx-auto mb-6 flex items-center justify-center text-white font-bold text-4xl"
                             style="width: 80px; height: 80px; border-radius: 16px; background-color: #e05a20; box-shadow: 0 4px 16px rgba(224, 90, 32, 0.3);">
                            {{ tenant.name.charAt(0).toUpperCase() }}
                        </div>

                        <!-- Welcome Text -->
                        <h1 class="text-3xl md:text-4xl font-bold text-slate-900 mb-4" style="letter-spacing: -0.02em; line-height: 1.2;">
                            Bienvenido a<br/>
                            <span style="color: #e05a20;">{{ tenant.name }}</span>
                        </h1>

                        <p class="text-lg text-slate-600 mb-8 max-w-md mx-auto" style="line-height: 1.6;">
                            Sistema de gestión para {{ tenant.name }}. Accede a tu panel de administración.
                        </p>

                        <!-- CTAs -->
                        <div class="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                            <button 
                                (click)="startLogin()"
                                class="inline-flex items-center justify-center rounded-md px-8 py-4 text-base font-semibold text-white transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 shadow-md hover:shadow-lg hover:-translate-y-0.5"
                                style="background-color: #e05a20; min-width: 200px;"
                            >
                                Acceder al panel
                                <svg class="ml-2 h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                                    <path stroke-linecap="round" stroke-linejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
                                </svg>
                            </button>

                            <a 
                                href="https://wa.me/573008578561"
                                target="_blank"
                                class="inline-flex items-center justify-center rounded-md px-8 py-4 text-base font-semibold transition-all duration-150 border-2 hover:bg-slate-50"
                                style="border-color: #e5ddd4; color: #6b6b80; min-width: 200px;"
                            >
                                <svg class="mr-2 h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12.04 2C6.58 2 2.06 6.5 2.05 12c0 1.86.52 3.64 1.48 5.2L2.03 22l5.07-1.33c1.53.84 3.27 1.3 5.09 1.3h.01c5.46 0 9.98-4.5 9.99-9.96.01-2.66-1.03-5.17-2.92-7.05A9.86 9.86 0 0012.04 2zm5.49 13.87c-.24.68-1.39 1.31-1.95 1.39-.53.08-1.03.24-3.44-.73-2.92-1.14-4.79-4.1-4.93-4.29-.14-.19-1.17-1.56-1.17-2.97 0-1.42.75-2.12 1.01-2.41.27-.29.57-.36.76-.36.19 0 .38 0 .55.01.18 0 .42-.07.66.5.24.58.92 2.02 1 2.17.08.15.13.33.03.53-.1.2-.15.33-.3.51-.15.18-.31.38-.45.51-.15.14-.3.29-.14.57.16.28.72 1.18 1.53 1.91 1.05.95 1.94 1.25 2.22 1.39.27.14.43.12.59-.07.16-.19.68-.79.86-1.06.18-.27.36-.23.6-.14.24.09 1.53.72 1.79.85.27.13.45.2.52.31.06.11.06.63-.18 1.31z"/>
                                </svg>
                                Contactar soporte
                            </a>
                        </div>

                        <!-- Info -->
                        <p class="text-sm" style="color: #9a9a9a;">
                            Panel de administración
                        </p>
                    </div>
                </main>
            }

            <!-- Footer -->
            <footer class="w-full py-6 text-center" style="background-color: rgba(255,255,255,0.5);">
                <p class="text-xs" style="color: #bdbdbd;">
                    Plataforma gestionada por <span class="font-semibold" style="color: #9a9a9a;">ORDAMY</span>
                </p>
                <p class="text-xs mt-1" style="color: #bdbdbd; opacity: 0.7;">
                    un producto de BIGSO
                </p>
            </footer>
        </div>
    `,
})
export class OrgRedirectComponent implements OnInit {
    tenant: Tenant | null = null;
    isLoading: boolean = true;
    error: string = '';
    private auth: BigsoAuth | null = null;

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private tenantService: TenantService
    ) { }

    ngOnInit() {
        const slug = this.route.snapshot.paramMap.get('slug');

        if (!slug) {
            this.error = 'No se proporcionó un identificador de negocio';
            this.isLoading = false;
            return;
        }

        // Load tenant info from API
        this.tenantService.getTenantBySlug(slug).subscribe({
            next: (tenant: Tenant | null) => {
                if (tenant) {
                    this.tenant = tenant;
                    // Store tenant info in localStorage for session persistence
                    this.tenantService.storeTenantInfo(tenant);

                    // Initialize auth SDK
                    // Decode base64 ID before passing to SSO SDK
                    const decodedTenantId = this.tenantService.decodeId(tenant.id);
                    this.auth = new BigsoAuth({
                        clientId: environment.appId,
                        ssoOrigin: environment.ssoPortalUrl,
                        jwksUrl: environment.jwksUrl,
                        debug: !environment.production,
                        theme: 'light',
                        timeout: 300000,
                        redirectUri: `${environment.baseUrl}/auth/callback`,
                        tenantId: decodedTenantId,
                    });
                } else {
                    this.error = `No se encontró un negocio con el identificador "${slug}"`;
                }
                this.isLoading = false;
            },
            error: (err: any) => {
                console.error('[Ordamy] Error loading tenant:', err);
                this.error = 'Error al cargar la información del negocio. Intenta de nuevo.';
                this.isLoading = false;
            }
        });
    }

    async startLogin() {
        if (!this.auth) {
            console.error('[Ordamy] Auth not initialized');
            return;
        }

        try {
            const result = await this.auth.login();
            console.log('[Ordamy] SSO login exitoso:', result);

            this.router.navigate(['/auth/callback'], {
                queryParams: {
                    payload: result.signed_payload,
                    codeVerifier: result.codeVerifier,
                }
            });
        } catch (error: any) {
            if (error?.message === 'Login aborted' || error?.message === 'Login cancelled by user') {
                console.log('[Ordamy] Login cancelado por el usuario');
                return;
            }
            console.error('[Ordamy] SSO login error:', error);
        }
    }

    goBack() {
        // Clear tenant storage when going back
        this.tenantService.clearStoredTenantInfo();
        this.router.navigate(['/welcome']);
    }
}