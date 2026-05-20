import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-dashboard-header',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard-header.component.html',
  styleUrls: ['./dashboard-header.component.css']
})
export class DashboardHeaderComponent {
  @Input() customerName: string = '';
  @Input() tenantName: string = '';
  @Input() showProfile: boolean = true;
  @Input() showLogout: boolean = true;
  @Output() logout = new EventEmitter<void>();

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').slice(0, 2).map((w: string) => w[0]?.toUpperCase() || '').join('');
  }

  onLogout(): void {
    this.logout.emit();
  }
}
