import { HttpClient } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';

export interface InvoiceUploadResponse {
  readonly id: string;
  readonly status: string;
}

export interface InvoiceSummary {
  readonly id: string;
  readonly vendor: string;
  readonly amount: number;
  readonly date: string;
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceApiService {
  private readonly http = inject(HttpClient);

  uploadInvoice(file: File): Observable<InvoiceUploadResponse> {
    const body = new FormData();
    body.append('file', file);
    return this.http.post<InvoiceUploadResponse>('/invoices/upload', body);
  }

  getInvoice(id: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(`/invoices/${id}`);
  }

  listInvoices(filters?: { q?: string; from?: string; to?: string }): Observable<InvoiceSummary[]> {
    const p: Record<string, string> = {};
    if (filters?.q) p['q'] = filters.q;
    if (filters?.from) p['from'] = filters.from;
    if (filters?.to) p['to'] = filters.to;
    return this.http.get<InvoiceSummary[]>('/invoices', { params: p });
  }
}
