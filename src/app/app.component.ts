import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet } from '@angular/router';
import { LoadingService } from './core/services/loading/loading.service';
import { ToastService, Toast } from './core/services/toast/toast.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterOutlet],
  template: `
    <router-outlet></router-outlet>
    
    <!-- Global Loader -->
    <div class="global-loader-overlay" *ngIf="loadingService.is()">
      <img src="assets/ordamy_loader.svg" alt="Cargando..." class="loader-spinner" />
    </div>

    <!-- Global Toasts Container -->
    <div class="toast-container" *ngIf="toastService.toasts$ | async as toasts">
      <div 
        *ngFor="let toast of toasts" 
        class="toast" 
        [ngClass]="'toast-' + toast.type"
        (click)="toastService.remove(toast.id)"
      >
        <div class="toast-indicator"></div>
        <div class="toast-content">
          <strong>{{ toast.title }}</strong>
          <p>{{ toast.message }}</p>
        </div>
        <button class="toast-close">&times;</button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; min-height: 100vh; }
    
    /* Global Loader */
    .global-loader-overlay {
      position: fixed;
      top: 0; left: 0; right: 0; bottom: 0;
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(4px);
      z-index: 9999;
      display: flex;
      justify-content: center;
      align-items: center;
    }
    .loader-spinner {
      width: 64px;
      height: 64px;
      animation: spin 1s linear infinite;
    }
    @keyframes spin { 100% { transform: rotate(360deg); } }

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
}
