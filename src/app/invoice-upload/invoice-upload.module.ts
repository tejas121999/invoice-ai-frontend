import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { InvoiceUploadRoutingModule } from './invoice-upload-routing.module';
import { InvoiceUploadPageComponent } from './components/invoice-upload-page/invoice-upload-page.component';

@NgModule({
  imports: [SharedModule, InvoiceUploadRoutingModule, InvoiceUploadPageComponent],
})
export class InvoiceUploadModule {}
