import { CommonModule } from '@angular/common';
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { FormsModule } from '@angular/forms';

export interface HeaderCta {
  id: string;
  type: 'button' | 'label';
  label: string;
  variant?: 'primary' | 'secondary' | 'ghost';
  hidden?: boolean;
}

@Component({
  selector: 'app-public-header',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './header.component.html',
  styleUrls: ['./header.component.css']
})
export class HeaderComponent {
  @Input() ctas: HeaderCta[] = [];
  @Output() ctaClick = new EventEmitter<string>();

  onCtaClick(ctaId: string): void {
    this.ctaClick.emit(ctaId);
  }
}
