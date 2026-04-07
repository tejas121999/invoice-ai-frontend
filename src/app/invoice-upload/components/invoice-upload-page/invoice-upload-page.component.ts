import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
import { InvoiceListRefreshService } from '../../../services/invoice-list-refresh.service';
import { InvoiceUploadService } from '../../services/invoice-upload.service';

@Component({
  selector: 'app-invoice-upload-page',
  standalone: true,
  imports: [RouterLink],
  templateUrl: './invoice-upload-page.component.html',
  styleUrl: './invoice-upload-page.component.css',
  providers: [InvoiceUploadService],
})
export class InvoiceUploadPageComponent {
  private readonly uploadService = inject(InvoiceUploadService);
  private readonly listRefresh = inject(InvoiceListRefreshService);

  protected readonly accept = 'application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg';
  protected readonly validationError = signal<string | null>(null);
  protected readonly uploadMessage = signal<string | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly selectedFile = signal<File | null>(null);
  protected readonly lastUploadDetail = signal<string | null>(null);

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    this.validationError.set(null);
    this.uploadMessage.set(null);
    this.lastUploadDetail.set(null);

    if (!file) {
      this.selectedFile.set(null);
      return;
    }

    const result = this.uploadService.validateFile(file);
    if (!result.valid) {
      this.validationError.set(result.error ?? 'Invalid file.');
      input.value = '';
      this.selectedFile.set(null);
      return;
    }

    this.selectedFile.set(file);
  }

  protected upload(input: HTMLInputElement): void {
    const file = this.selectedFile();
    this.validationError.set(null);
    this.uploadMessage.set(null);
    this.lastUploadDetail.set(null);

    if (!file) {
      this.validationError.set('Choose a file to upload.');
      return;
    }

    const check = this.uploadService.validateFile(file);
    if (!check.valid) {
      this.validationError.set(check.error ?? 'Invalid file.');
      return;
    }

    this.isUploading.set(true);
    this.uploadService.upload(file).subscribe({
      next: (res) => {
        this.uploadMessage.set(`Uploaded successfully (${res.uploadStatus}).`);
        this.lastUploadDetail.set(
          `ID ${res.invoiceId} · ${res.fileName} · ${res.mimeType} · ${res.size} bytes · ` +
            `processing: ${res.processingStatus}` +
            (res.uploadedAt ? ` · ${res.uploadedAt}` : ''),
        );
        this.isUploading.set(false);
        input.value = '';
        this.selectedFile.set(null);
        this.listRefresh.notifyListShouldRefresh();
      },
      error: (err: unknown) => {
        this.validationError.set(this.formatUploadError(err));
        this.isUploading.set(false);
      },
    });
  }

  private formatUploadError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return 'Cannot reach the server. Check that the API is running at your configured base URL.';
      }
      const body = err.error;
      if (body && typeof body === 'object' && 'message' in body) {
        const m = (body as { message: unknown }).message;
        if (typeof m === 'string' && m) {
          return m;
        }
      }
      if (typeof body === 'string' && body) {
        return body;
      }
      return `Upload failed (${err.status}).`;
    }
    return 'Upload failed. Try again.';
  }
}
