import { Component, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './core/services/loading/loading.service';
import { ToastService, Toast } from './core/services/toast/toast.service';
import { LoaderOverlayComponent } from './shared/components/loader-overlay/loader-overlay.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet, LoaderOverlayComponent],
  templateUrl: './app.component.html',
  styles: [`
    :host { display: block; min-height: 100vh; }

    /* Toasts */
    .toast-container {
      position: fixed;
      top: 20px;
      right: 20px;
      z-index: 10000;
      display: flex;
      flex-direction: column;
      gap: 10px;
      pointer-events: none;
    }
    .toast {
      background: white;
      border-radius: 8px;
      box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
      width: 320px;
      display: flex;
      align-items: flex-start;
      overflow: hidden;
      pointer-events: auto;
      cursor: pointer;
      animation: slideIn 0.3s ease-out forwards;
      border: 1px solid #e2e8f0;
    }
    @keyframes slideIn {
      from { transform: translateX(100%); opacity: 0; }
      to { transform: translateX(0); opacity: 1; }
    }
    .toast-indicator { width: 4px; align-self: stretch; }
    .toast-success .toast-indicator { background: #10b981; }
    .toast-error .toast-indicator { background: #ef4444; }
    .toast-warning .toast-indicator { background: #f59e0b; }
    .toast-info .toast-indicator { background: #3b82f6; }
    
    .toast-content {
      padding: 12px 16px;
      flex: 1;
    }
    .toast-content strong {
      display: block;
      font-size: 0.875rem;
      margin-bottom: 4px;
      color: #1e293b;
    }
    .toast-content p {
      margin: 0;
      font-size: 0.8rem;
      color: #64748b;
    }
    
    .toast-close {
      background: none;
      border: none;
      padding: 12px;
      font-size: 1.2rem;
      color: #94a3b8;
      cursor: pointer;
    }
    .toast-close:hover { color: #1e293b; }
  `],
})
export class AppComponent {
  constructor(
    public loadingService: LoadingService,
    public toastService: ToastService
  ) { }

  // Prevent scroll from changing number input values globally
  @HostListener('wheel', ['$event'])
  onWheel(event: WheelEvent) {
    const target = event.target as HTMLElement;
    if (target.tagName === 'INPUT' && (target as HTMLInputElement).type === 'number') {
      (target as HTMLInputElement).blur();
    }
  }

  // Auto-select content on number inputs for easier editing
  @HostListener('focusin', ['$event'])
  onFocusIn(event: FocusEvent) {
    const target = event.target as HTMLInputElement;
    if (target.tagName === 'INPUT' && target.type === 'number') {
      setTimeout(() => target.select(), 0);
    }
  }
}
