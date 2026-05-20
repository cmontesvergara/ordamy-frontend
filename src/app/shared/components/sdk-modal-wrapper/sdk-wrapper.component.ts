import { CommonModule } from '@angular/common';
import { Component, inject } from '@angular/core';
import { Router } from '@angular/router';
import { SdkService } from '../../../core/services/sdk/sdk.service';
import { SdkSignUpComponent } from '../../../modules/auth/components/sdk-sign-up/sdk-sign-up.component';

@Component({
  selector: 'app-sdk-wrapper',
  standalone: true,
  imports: [CommonModule, SdkSignUpComponent],
  templateUrl: './sdk-wrapper.component.html',
  styleUrls: ['./sdk-wrapper.component.css']
})
export class SdkWrapperComponent {
  private sdkService = inject(SdkService);
  constructor(private router: Router) { }
  activeModal = this.sdkService.activeModal$;

  close(): void {
    this.sdkService.closeModal();
  }

}
