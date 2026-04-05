import { DecimalPipe } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { catchError, debounceTime, distinctUntilChanged, of, Subject, switchMap } from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InvoiceApiService, InvoiceSummary } from '../../../services/invoice-api.service';

@Component({
  selector: 'app-invoice-history-page',
  standalone: true,
  imports: [FormsModule, DecimalPipe],
  templateUrl: './invoice-history-page.component.html',
  styleUrl: './invoice-history-page.component.css',
})
export class InvoiceHistoryPageComponent {
  private readonly invoiceApi = inject(InvoiceApiService);
  private readonly search$ = new Subject<string>();

  protected readonly rows = signal<InvoiceSummary[]>([]);
  protected readonly query = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');

  private readonly demo: InvoiceSummary[] = [
    { id: 'inv-101', vendor: 'Acme Supplies', amount: 420.1, date: '2026-03-12' },
    { id: 'inv-102', vendor: 'Northwind LLC', amount: 89.99, date: '2026-03-18' },
    { id: 'inv-103', vendor: 'Contoso', amount: 1200, date: '2026-04-01' },
  ];

  constructor() {
    this.search$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) =>
          this.invoiceApi
            .listInvoices({ q: q || undefined, from: this.from() || undefined, to: this.to() || undefined })
            .pipe(catchError(() => of(this.filterDemo(q)))),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((list) => this.rows.set(list));

    this.refresh();
  }

  private filterDemo(q: string): InvoiceSummary[] {
    const needle = q.trim().toLowerCase();
    if (!needle) {
      return this.demo;
    }
    return this.demo.filter((r) => r.vendor.toLowerCase().includes(needle) || r.id.toLowerCase().includes(needle));
  }

  protected onQueryInput(value: string): void {
    this.query.set(value);
    this.search$.next(value);
  }

  protected applyFilters(): void {
    this.refresh();
  }

  private refresh(): void {
    this.invoiceApi
      .listInvoices({
        q: this.query() || undefined,
        from: this.from() || undefined,
        to: this.to() || undefined,
      })
      .pipe(catchError(() => of(this.filterDemo(this.query()))))
      .subscribe((list) => this.rows.set(list));
  }
}
