import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { InvoiceUploadPageComponent } from './components/invoice-upload-page/invoice-upload-page.component';

const routes: Routes = [
  {
    path: '',
    component: InvoiceUploadPageComponent,
  },
];

@NgModule({
  imports: [RouterModule.forChild(routes)],
  exports: [RouterModule],
})
export class InvoiceUploadRoutingModule {}
