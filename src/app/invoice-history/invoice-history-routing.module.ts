import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceHistoryPageComponent } from './components/invoice-history-page/invoice-history-page.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceHistoryPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvoiceHistoryRoutingModule {}
