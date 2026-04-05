import { Component, inject, signal } from '@angular/core';
import { NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, of } from 'rxjs';
import { InvoiceApiService } from '../../../services/invoice-api.service';

@Component({
  selector: 'app-invoice-review-page',
  standalone: true,
  imports: [ReactiveFormsModule],
  templateUrl: './invoice-review-page.component.html',
  styleUrl: './invoice-review-page.component.css',
})
export class InvoiceReviewPageComponent {
  private readonly route = inject(ActivatedRoute);
  private readonly fb = inject(NonNullableFormBuilder);
  private readonly invoiceApi = inject(InvoiceApiService);

  protected readonly invoiceId = signal<string>('');

  protected readonly form = this.fb.group({
    vendor: this.fb.control(''),
    invoiceNumber: this.fb.control(''),
    amount: this.fb.control(0),
    date: this.fb.control(''),
  });

  constructor() {
    const id = this.route.snapshot.paramMap.get('id') ?? '';
    this.invoiceId.set(id);
    this.invoiceApi.getInvoice(id).pipe(catchError(() => of(null))).subscribe((data) => {
      if (!data) {
        this.form.patchValue({
          vendor: 'Demo Vendor LLC',
          invoiceNumber: id || 'INV-000',
          amount: 1250.5,
          date: new Date().toISOString().slice(0, 10),
        });
        return;
      }
      this.form.patchValue({
        vendor: String(data['vendor'] ?? ''),
        invoiceNumber: String(data['invoiceNumber'] ?? ''),
        amount: Number(data['amount'] ?? 0),
        date: String(data['date'] ?? ''),
      });
    });
  }

  protected saveDraft(): void {
    this.form.markAllAsTouched();
  }
}
