import { NgModule } from '@angular/core';
import { SharedModule } from '../shared/shared.module';
import { InvoiceHistoryRoutingModule } from './invoice-history-routing.module';
import { InvoiceHistoryPageComponent } from './components/invoice-history-page/invoice-history-page.component';

@NgModule({
  imports: [SharedModule, InvoiceHistoryRoutingModule, InvoiceHistoryPageComponent],
})
export class InvoiceHistoryModule {}
