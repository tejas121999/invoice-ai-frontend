import { Component, inject, signal } from '@angular/core';
import { RouterLink } from '@angular/router';
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

  protected readonly accept = 'application/pdf,image/png,image/jpeg,.pdf,.png,.jpg,.jpeg';
  protected readonly validationError = signal<string | null>(null);
  protected readonly uploadMessage = signal<string | null>(null);
  protected readonly isUploading = signal(false);
  protected readonly lastFileName = signal<string | null>(null);

  protected onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];
    this.validationError.set(null);
    this.uploadMessage.set(null);
    this.lastFileName.set(file?.name ?? null);

    const result = this.uploadService.validateFile(file);
    if (!result.valid) {
      this.validationError.set(result.error ?? 'Invalid file.');
      input.value = '';
      return;
    }
    if (!file) {
      return;
    }

    this.isUploading.set(true);
    this.uploadService.upload(file).subscribe({
      next: (res) => {
        this.uploadMessage.set(`Uploaded as ${res.id} — ${res.status}`);
        this.isUploading.set(false);
        input.value = '';
      },
      error: () => {
        this.validationError.set('Upload failed. Try again.');
        this.isUploading.set(false);
      },
    });
  }
}
