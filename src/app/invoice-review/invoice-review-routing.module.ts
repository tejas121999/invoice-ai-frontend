import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceReviewPageComponent } from './components/invoice-review-page/invoice-review-page.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceReviewPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvoiceReviewRoutingModule {}
