import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable, inject } from '@angular/core';
import { Observable, map } from 'rxjs';
import { APP_CONFIG } from '../core/config/app-config';

/** Normalized upload response from POST /invoices/upload */
export interface InvoiceUploadResult {
  readonly invoiceId: string;
  readonly fileName: string;
  readonly originalName: string;
  readonly filePath: string;
  readonly mimeType: string;
  readonly size: number;
  readonly uploadStatus: string;
  readonly processingStatus: string;
  readonly uploadedAt: string;
}

/** Row for GET /invoices list */
export interface InvoiceListItem {
  readonly id: string;
  readonly fileName: string;
  readonly fileType: string;
  readonly uploadStatus: string;
  readonly processingStatus: string;
  readonly uploadedAt: string;
}

export interface InvoiceExtractedFields {
  readonly invoiceNumber?: string;
  readonly vendorName?: string;
  readonly invoiceDate?: string;
  readonly dueDate?: string;
  readonly subtotal?: number | string;
  readonly taxAmount?: number | string;
  readonly totalAmount?: number | string;
  readonly currency?: string;
  readonly [key: string]: unknown;
}

export interface InvoiceResultResponse {
  readonly invoiceId: number | string;
  readonly status: string;
  readonly fileName: string;
  readonly filePath: string;
  readonly uploadedAt: string;
  readonly processedAt: string | null;
  readonly rawText: string;
  readonly fields: InvoiceExtractedFields;
  readonly confidence?: Record<string, number | string>;
  readonly reviewedFieldsJson?: string | Record<string, unknown> | null;
  readonly isReviewed: boolean;
}

function asRecord(v: unknown): Record<string, unknown> {
  return v && typeof v === 'object' && !Array.isArray(v) ? (v as Record<string, unknown>) : {};
}

function pickStr(obj: Record<string, unknown>, ...keys: string[]): string {
  for (const k of keys) {
    const v = obj[k];
    if (v !== undefined && v !== null && String(v) !== '') {
      return String(v);
    }
  }
  return '';
}

function pickNum(obj: Record<string, unknown>, ...keys: string[]): number {
  for (const k of keys) {
    const v = obj[k];
    if (typeof v === 'number' && !Number.isNaN(v)) {
      return v;
    }
    if (typeof v === 'string' && v !== '') {
      const n = Number(v);
      if (!Number.isNaN(n)) {
        return n;
      }
    }
  }
  return 0;
}

@Injectable({
  providedIn: 'root',
})
export class InvoiceApiService {
  private readonly http = inject(HttpClient);
  private readonly appConfig = inject(APP_CONFIG);

  private endpoint(path: string): string {
    return `${this.appConfig.apiBaseUrl}/invoices${path}`;
  }

  uploadInvoice(file: File): Observable<InvoiceUploadResult> {
    const body = new FormData();
    body.append('file', file);
    return this.http
      .post<unknown>(this.endpoint('/upload'), body)
      .pipe(map((raw) => this.normalizeUpload(raw)));
  }

  getInvoice(id: string): Observable<Record<string, unknown>> {
    return this.http.get<Record<string, unknown>>(this.endpoint(`/${id}`));
  }

  /**
   * GET /invoices — supports wrapped payloads `{ data: [] }` / `{ invoices: [] }` and snake_case fields.
   */
  getInvoices(filters?: { q?: string; from?: string; to?: string }): Observable<InvoiceListItem[]> {
    let params = new HttpParams();
    if (filters?.q) {
      params = params.set('q', filters.q);
    }
    if (filters?.from) {
      params = params.set('from', filters.from);
    }
    if (filters?.to) {
      params = params.set('to', filters.to);
    }
    const options = params.keys().length ? { params } : {};
    return this.http.get<unknown>(this.endpoint(''), options).pipe(
      map((body) => this.extractRows(body)),
      map((rows) => rows.map((r) => this.normalizeListItem(asRecord(r)))),
      map((rows) => this.applyClientFilters(rows, filters)),
    );
  }

  getInvoiceResult(id: string): Observable<InvoiceResultResponse> {
    return this.http
      .get<unknown>(this.endpoint(`/${encodeURIComponent(id)}/result`))
      .pipe(map((raw) => this.normalizeInvoiceResult(raw)));
  }

  processInvoice(id: string): Observable<unknown> {
    return this.http.post<unknown>(this.endpoint(`/${encodeURIComponent(id)}/process`), {});
  }

  private normalizeUpload(raw: unknown): InvoiceUploadResult {
    const o = asRecord(raw);
    const invoiceId = pickStr(o, 'invoiceId', 'invoice_id', 'id');
    const fileName = pickStr(o, 'fileName', 'file_name');
    const originalName = pickStr(o, 'originalName', 'original_name', 'fileName', 'file_name');
    return {
      invoiceId,
      fileName,
      originalName: originalName || fileName,
      filePath: pickStr(o, 'filePath', 'file_path'),
      mimeType: pickStr(o, 'mimeType', 'mime_type'),
      size: pickNum(o, 'size', 'fileSize', 'file_size'),
      uploadStatus: pickStr(o, 'uploadStatus', 'upload_status') || 'unknown',
      processingStatus: pickStr(o, 'processingStatus', 'processing_status') || 'unknown',
      uploadedAt: pickStr(o, 'uploadedAt', 'uploaded_at', 'createdAt', 'created_at'),
    };
  }

  private normalizeInvoiceResult(raw: unknown): InvoiceResultResponse {
    const root = asRecord(raw);
    const payload =
      root['data'] !== undefined && typeof root['data'] === 'object' && !Array.isArray(root['data'])
        ? asRecord(root['data'])
        : root;

    const fieldsRaw = payload['fields'];
    const fields: InvoiceExtractedFields =
      fieldsRaw && typeof fieldsRaw === 'object' && !Array.isArray(fieldsRaw)
        ? (fieldsRaw as InvoiceExtractedFields)
        : {};

    const confRaw = payload['confidence'];
    const confidence: Record<string, number | string> | undefined =
      confRaw && typeof confRaw === 'object' && !Array.isArray(confRaw)
        ? (confRaw as Record<string, number | string>)
        : undefined;

    const reviewedRaw =
      payload['reviewedFieldsJson'] ?? payload['reviewed_fields_json'] ?? payload['reviewedFields'];
    let reviewedFieldsJson: string | Record<string, unknown> | null = null;
    if (typeof reviewedRaw === 'string') {
      reviewedFieldsJson = reviewedRaw;
    } else if (reviewedRaw && typeof reviewedRaw === 'object' && !Array.isArray(reviewedRaw)) {
      reviewedFieldsJson = reviewedRaw as Record<string, unknown>;
    }

    const invoiceIdVal = payload['invoiceId'] ?? payload['invoice_id'] ?? payload['id'];
    let invoiceId: number | string = '';
    if (typeof invoiceIdVal === 'number' && !Number.isNaN(invoiceIdVal)) {
      invoiceId = invoiceIdVal;
    } else if (typeof invoiceIdVal === 'string' && invoiceIdVal !== '') {
      invoiceId = invoiceIdVal;
    } else {
      const n = pickNum(payload, 'invoiceId', 'invoice_id', 'id');
      invoiceId = n !== 0 ? n : '';
    }

    const processedAtRaw = payload['processedAt'] ?? payload['processed_at'];
    const processedAt =
      processedAtRaw === null || processedAtRaw === undefined ? null : String(processedAtRaw);

    return {
      invoiceId,
      status: pickStr(payload, 'status', 'processingStatus', 'processing_status') || '—',
      fileName: pickStr(payload, 'fileName', 'file_name') || '—',
      filePath: pickStr(payload, 'filePath', 'file_path') || '—',
      uploadedAt: pickStr(payload, 'uploadedAt', 'uploaded_at', 'createdAt', 'created_at') || '—',
      processedAt,
      rawText: pickStr(payload, 'rawText', 'raw_text', 'ocrText', 'ocr_text') || '',
      fields,
      confidence,
      reviewedFieldsJson,
      isReviewed: Boolean(payload['isReviewed'] ?? payload['is_reviewed'] ?? false),
    };
  }

  private extractRows(body: unknown): unknown[] {
    if (Array.isArray(body)) {
      return body;
    }
    const o = asRecord(body);
    if (Array.isArray(o['data'])) {
      return o['data'];
    }
    const dataObj = o['data'];
    if (dataObj && typeof dataObj === 'object' && !Array.isArray(dataObj)) {
      const inner = asRecord(dataObj);
      for (const key of ['invoices', 'items', 'rows', 'results'] as const) {
        if (Array.isArray(inner[key])) {
          return inner[key];
        }
      }
    }
    if (Array.isArray(o['invoices'])) {
      return o['invoices'];
    }
    if (Array.isArray(o['items'])) {
      return o['items'];
    }
    return [];
  }

  private normalizeListItem(raw: Record<string, unknown>): InvoiceListItem {
    const fileName = pickStr(raw, 'fileName', 'file_name', 'originalName', 'original_name');
    const mime = pickStr(raw, 'mimeType', 'mime_type', 'fileType', 'file_type');
    const ext = fileName.includes('.') ? (fileName.split('.').pop() ?? '').toLowerCase() : '';
    const fileType = mime || ext || '—';
    const id = pickStr(raw, 'id', 'invoiceId', 'invoice_id');
    return {
      id: id || '—',
      fileName: fileName || '—',
      fileType,
      uploadStatus: pickStr(raw, 'uploadStatus', 'upload_status') || '—',
      processingStatus: pickStr(raw, 'processingStatus', 'processing_status') || '—',
      uploadedAt: pickStr(raw, 'uploadedAt', 'uploaded_at', 'createdAt', 'created_at') || '—',
    };
  }

  private applyClientFilters(
    rows: InvoiceListItem[],
    filters?: { q?: string; from?: string; to?: string },
  ): InvoiceListItem[] {
    if (!filters) {
      return rows;
    }
    let out = rows;
    const q = filters.q?.trim().toLowerCase();
    if (q) {
      out = out.filter(
        (r) =>
          r.fileName.toLowerCase().includes(q) ||
          r.id.toLowerCase().includes(q) ||
          r.uploadStatus.toLowerCase().includes(q),
      );
    }
    if (filters.from) {
      out = out.filter((r) => this.datePart(r.uploadedAt) >= filters.from!);
    }
    if (filters.to) {
      out = out.filter((r) => this.datePart(r.uploadedAt) <= filters.to!);
    }
    return out;
  }

  private datePart(isoOrDate: string): string {
    if (!isoOrDate || isoOrDate === '—') {
      return '';
    }
    return isoOrDate.slice(0, 10);
  }
}
