import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment } from '../../../../../environments/environment.prod';
import { SdkService } from '../../../../core/services/sdk/sdk.service';

@Component({
  selector: 'app-sdk-sign-up',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './sdk-sign-up.component.html',
  styleUrls: ['./sdk-sign-up.component.scss']
})
export class SdkSignUpComponent {
  ssoSignUpUrl: SafeResourceUrl;

  private router = inject(Router);
  private sanitizer = inject(DomSanitizer);
  private sdkService = inject(SdkService);

  constructor() {
    const baseUrl = environment.ssoPortalUrl || 'https://sso.bigso.test';
    this.ssoSignUpUrl = this.sanitizer.bypassSecurityTrustResourceUrl(`${baseUrl}/auth/iframe-sign-up?appName=Ordamy`);
  }

  close(): void {
    this.sdkService.closeModal();
  }


}
