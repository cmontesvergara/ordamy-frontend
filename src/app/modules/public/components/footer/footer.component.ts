import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

export type FooterVariant = 'tenant' | 'auth' | 'corporate';

@Component({
  selector: 'app-public-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.css']
})
export class FooterComponent {
  @Input() variant: FooterVariant = 'tenant';
  @Input() tenantName: string = '';
  @Input() showOrdamyCredit: boolean = true;
  @Input() brandColor: string = '#e05a20';
}
