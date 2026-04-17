import { Component, Input } from '@angular/core';


@Component({
    selector: 'app-loader-overlay',
    imports: [],
    template: `
    <div class="loader-overlay" [class.loader-fixed]="mode === 'fixed'" [class.loader-absolute]="mode === 'absolute'">
        <img src="assets/ordamy_loader.svg" alt="Cargando..." class="loader-spinner" />
    </div>
    `,
    styles: [`
        .loader-overlay {
            background: rgba(255, 255, 255, 0.7);
            backdrop-filter: blur(4px);
            display: flex;
            justify-content: center;
            align-items: center;
        }
        .loader-fixed {
            position: fixed;
            inset: 0;
            z-index: 9999;
        }
        .loader-absolute {
            position: absolute;
            inset: 0;
            z-index: 20;
            border-radius: inherit;
        }
        .loader-spinner {
            width: 48px;
            height: 48px;
            animation: spin 1s linear infinite;
        }
        .loader-fixed .loader-spinner {
            width: 64px;
            height: 64px;
        }
        @keyframes spin { 100% { transform: rotate(360deg); } }
    `]
})
export class LoaderOverlayComponent {
    /** 'fixed' for full-screen global loader, 'absolute' for scoped within a parent */
    @Input() mode: 'fixed' | 'absolute' = 'absolute';
}
