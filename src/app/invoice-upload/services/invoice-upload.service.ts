import { Injectable, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { InvoiceApiService, InvoiceUploadResult } from '../../services/invoice-api.service';

export interface FileValidationResult {
  readonly valid: boolean;
  readonly error?: string;
}

@Injectable()
export class InvoiceUploadService {
  private readonly api = inject(InvoiceApiService);

  readonly maxFileBytes = 10 * 1024 * 1024;
  readonly allowedMimeTypes = new Set(['application/pdf', 'image/png', 'image/jpeg']);

  validateFile(file: File | null | undefined): FileValidationResult {
    if (!file) {
      return { valid: false, error: 'Choose a file to upload.' };
    }
    if (file.size > this.maxFileBytes) {
      return { valid: false, error: 'File is too large (max 10 MB).' };
    }
    const ext = file.name.split('.').pop()?.toLowerCase();
    const allowedExt = new Set(['pdf', 'png', 'jpg', 'jpeg']);
    if (file.type) {
      if (!this.allowedMimeTypes.has(file.type)) {
        return { valid: false, error: 'Only PDF, PNG, or JPEG files are allowed.' };
      }
    } else if (!ext || !allowedExt.has(ext)) {
      return { valid: false, error: 'Only PDF, PNG, or JPEG files are allowed.' };
    }
    return { valid: true };
  }

  upload(file: File): Observable<InvoiceUploadResult> {
    return this.api.uploadInvoice(file);
  }
}
