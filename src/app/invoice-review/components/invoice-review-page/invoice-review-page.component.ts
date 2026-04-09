import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { FormControl, FormGroup, NonNullableFormBuilder, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { catchError, distinctUntilChanged, filter, finalize, map, of, switchMap, tap } from 'rxjs';
import { InvoiceApiService, InvoiceResultResponse } from '../../../services/invoice-api.service';

type BaseFieldKey =
  | 'invoiceNumber'
  | 'vendorName'
  | 'invoiceDate'
  | 'dueDate'
  | 'subtotal'
  | 'taxAmount'
  | 'totalAmount'
  | 'currency';

const BASE_FIELDS: BaseFieldKey[] = [
  'invoiceNumber',
  'vendorName',
  'invoiceDate',
  'dueDate',
  'subtotal',
  'taxAmount',
  'totalAmount',
  'currency',
];

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

  protected readonly invoiceId = signal<string | null>(null);
  protected readonly loading = signal(true);
  protected readonly loadError = signal<string | null>(null);
  protected readonly result = signal<InvoiceResultResponse | null>(null);
  protected readonly dynamicFieldKeys = signal<string[]>([]);

  protected readonly form = this.fb.group({
    invoiceNumber: this.fb.control(''),
    vendorName: this.fb.control(''),
    invoiceDate: this.fb.control(''),
    dueDate: this.fb.control(''),
    subtotal: this.fb.control(''),
    taxAmount: this.fb.control(''),
    totalAmount: this.fb.control(''),
    currency: this.fb.control(''),
  });

  constructor() {
    const paramRoute = this.route.parent ?? this.route;
    paramRoute.paramMap
      .pipe(
        takeUntilDestroyed(),
        map((p) => p.get('id')?.trim() ?? ''),
        distinctUntilChanged(),
        tap((rawId) => {
          this.result.set(null);
          this.loadError.set(null);
          if (!rawId) {
            this.loading.set(false);
            this.invoiceId.set(null);
            this.loadError.set('Invalid invoice id in route.');
            return;
          }
          this.invoiceId.set(rawId);
          this.loading.set(true);
        }),
        filter((rawId) => !!rawId),
        switchMap((rawId) => {
          this.resetFormState();
          return this.invoiceApi.getInvoiceResult(rawId).pipe(
            catchError((err: unknown) => {
              this.loadError.set(this.errorMessage(err));
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
      )
      .subscribe((res) => {
        if (!res) {
          return;
        }
        this.result.set(res);
        const fieldsRecord = this.fieldsAsRecord(res.fields);
        const merged = this.mergeFields(fieldsRecord, res.reviewedFieldsJson);
        this.ensureDynamicControls(merged);
        this.form.patchValue(this.toPatchValue(merged), { emitEvent: false });
        for (const key of this.dynamicFieldKeys()) {
          this.form.get(key)?.setValue(String(merged[key] ?? ''), { emitEvent: false });
        }
      });
  }

  protected saveDraft(): void {
    this.form.markAllAsTouched();
  }

  protected fieldLabel(field: string): string {
    const labels: Record<string, string> = {
      invoiceNumber: 'Invoice Number',
      vendorName: 'Vendor Name',
      invoiceDate: 'Invoice Date',
      dueDate: 'Due Date',
      subtotal: 'Subtotal',
      taxAmount: 'Tax Amount',
      totalAmount: 'Total Amount',
      currency: 'Currency',
    };
    return labels[field] ?? field;
  }

  protected confidenceFor(field: string): number | null {
    const confidence = this.result()?.confidence;
    if (!confidence) {
      return null;
    }
    const raw = confidence[field];
    if (raw === undefined || raw === null || raw === '') {
      return null;
    }
    const n = Number(raw);
    if (Number.isNaN(n)) {
      return null;
    }
    // API may send 0–1 (e.g. 0.95) or 0–100 (e.g. 95)
    if (n > 0 && n <= 1) {
      return Math.round(n * 100);
    }
    return Math.round(n);
  }

  private resetFormState(): void {
    const dynamicForm = this.form as unknown as FormGroup<Record<string, FormControl<string>>>;
    const forRemoval = this.form as unknown as FormGroup;
    for (const key of this.dynamicFieldKeys()) {
      if (forRemoval.contains(key)) {
        forRemoval.removeControl(key);
      }
    }
    this.dynamicFieldKeys.set([]);
    this.form.reset(
      {
        invoiceNumber: '',
        vendorName: '',
        invoiceDate: '',
        dueDate: '',
        subtotal: '',
        taxAmount: '',
        totalAmount: '',
        currency: '',
      },
      { emitEvent: false },
    );
  }

  private fieldsAsRecord(fields: InvoiceResultResponse['fields']): Record<string, unknown> {
    if (fields && typeof fields === 'object' && !Array.isArray(fields)) {
      return fields as Record<string, unknown>;
    }
    return {};
  }

  private mergeFields(
    extractedFields: Record<string, unknown>,
    reviewedFieldsJson: InvoiceResultResponse['reviewedFieldsJson'],
  ): Record<string, unknown> {
    const reviewed = this.parseReviewedFields(reviewedFieldsJson);
    return { ...extractedFields, ...reviewed };
  }

  private parseReviewedFields(
    reviewedFieldsJson: InvoiceResultResponse['reviewedFieldsJson'],
  ): Record<string, unknown> {
    if (!reviewedFieldsJson) {
      return {};
    }
    if (typeof reviewedFieldsJson === 'object' && !Array.isArray(reviewedFieldsJson)) {
      return reviewedFieldsJson as Record<string, unknown>;
    }
    if (typeof reviewedFieldsJson === 'string') {
      try {
        const parsed: unknown = JSON.parse(reviewedFieldsJson);
        if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
          return parsed as Record<string, unknown>;
        }
      } catch {
        return {};
      }
    }
    return {};
  }

  private ensureDynamicControls(merged: Record<string, unknown>): void {
    const dynamicKeys = Object.keys(merged).filter((key) => !BASE_FIELDS.includes(key as BaseFieldKey));
    this.dynamicFieldKeys.set(dynamicKeys);
    const dynamicForm = this.form as unknown as FormGroup<Record<string, FormControl<string>>>;
    for (const key of dynamicKeys) {
      if (!dynamicForm.contains(key)) {
        dynamicForm.addControl(key, this.fb.control(''));
      }
    }
  }

  private toPatchValue(merged: Record<string, unknown>): Record<BaseFieldKey, string> {
    return {
      invoiceNumber: String(merged['invoiceNumber'] ?? ''),
      vendorName: String(merged['vendorName'] ?? ''),
      invoiceDate: String(merged['invoiceDate'] ?? ''),
      dueDate: String(merged['dueDate'] ?? ''),
      subtotal: String(merged['subtotal'] ?? ''),
      taxAmount: String(merged['taxAmount'] ?? ''),
      totalAmount: String(merged['totalAmount'] ?? ''),
      currency: String(merged['currency'] ?? ''),
    };
  }

  private errorMessage(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Cannot reach the server. Check that the API is running.';
      }
      if (err.status === 404) {
        return 'No extraction result was found for this invoice. It may not be processed yet—use Process on the History page, then open Review again.';
      }
      return `Failed to load invoice result (${err.status}).`;
    }
    return 'Failed to load invoice result.';
  }
}
