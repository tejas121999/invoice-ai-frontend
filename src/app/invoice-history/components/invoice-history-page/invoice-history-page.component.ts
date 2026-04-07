import { DatePipe } from '@angular/common';
import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import {
  catchError,
  debounceTime,
  distinctUntilChanged,
  finalize,
  of,
  Subject,
  switchMap,
} from 'rxjs';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { InvoiceApiService, InvoiceListItem } from '../../../services/invoice-api.service';
import { InvoiceListRefreshService } from '../../../services/invoice-list-refresh.service';

@Component({
  selector: 'app-invoice-history-page',
  standalone: true,
  imports: [FormsModule, DatePipe],
  templateUrl: './invoice-history-page.component.html',
  styleUrl: './invoice-history-page.component.css',
})
export class InvoiceHistoryPageComponent {
  private readonly invoiceApi = inject(InvoiceApiService);
  private readonly listRefresh = inject(InvoiceListRefreshService);
  private readonly search$ = new Subject<string>();

  protected readonly rows = signal<InvoiceListItem[]>([]);
  protected readonly query = signal('');
  protected readonly from = signal('');
  protected readonly to = signal('');
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);

  constructor() {
    this.search$
      .pipe(
        debounceTime(200),
        distinctUntilChanged(),
        switchMap((q) => this.fetchList(q)),
        takeUntilDestroyed(),
      )
      .subscribe((list) => this.rows.set(list));

    this.listRefresh.onRefresh$.pipe(takeUntilDestroyed()).subscribe(() => {
      this.fetchList(this.query()).subscribe((list) => this.rows.set(list));
    });

    this.fetchList(this.query()).subscribe((list) => this.rows.set(list));
  }

  protected onQueryInput(value: string): void {
    this.query.set(value);
    this.search$.next(value);
  }

  protected applyFilters(): void {
    this.fetchList(this.query()).subscribe((list) => this.rows.set(list));
  }

  protected uploadedAtDisplay(value: string): string | null {
    if (!value || value === '—') {
      return null;
    }
    return value;
  }

  private fetchList(q: string) {
    this.loading.set(true);
    this.loadError.set(null);
    return this.invoiceApi
      .getInvoices({
        q: q || undefined,
        from: this.from() || undefined,
        to: this.to() || undefined,
      })
      .pipe(
        catchError((err: unknown) => {
          this.loadError.set(this.errorMessage(err));
          return of([] as InvoiceListItem[]);
        }),
        finalize(() => this.loading.set(false)),
      );
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Cannot reach the server. Check that the API is running at your configured base URL.';
      }
      if (typeof err.error === 'string' && err.error) {
        return err.error;
      }
      if (err.error && typeof err.error === 'object' && 'message' in err.error) {
        const m = (err.error as { message: unknown }).message;
        if (typeof m === 'string' && m) {
          return m;
        }
      }
      return `Failed to load invoices (${err.status}).`;
    }
    return 'Failed to load invoices.';
  }
}
