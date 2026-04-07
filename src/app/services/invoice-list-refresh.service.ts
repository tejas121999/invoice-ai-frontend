import { Injectable } from '@angular/core';
import { Observable, Subject } from 'rxjs';

/** Notifies subscribers (e.g. history page) to reload after a successful upload. */
@Injectable({
  providedIn: 'root',
})
export class InvoiceListRefreshService {
  private readonly refresh$ = new Subject<void>();

  /** Emits when the invoice list should be re-fetched. */
  readonly onRefresh$: Observable<void> = this.refresh$.asObservable();

  notifyListShouldRefresh(): void {
    this.refresh$.next();
  }
}
