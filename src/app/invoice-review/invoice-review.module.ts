import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { InvoiceReviewRoutingModule } from './invoice-review-routing.module';
import { InvoiceReviewPageComponent } from './components/invoice-review-page/invoice-review-page.component';

@NgModule({
  imports: [SharedModule, InvoiceReviewRoutingModule, InvoiceReviewPageComponent],
})
export class InvoiceReviewModule {}
