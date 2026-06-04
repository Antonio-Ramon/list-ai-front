import { Component, DestroyRef, inject, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ExtractionFormat } from '../../types/extraction.types';

@Component({
  selector: 'la-upload-form',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './upload-form.component.html',
  styleUrl: './upload-form.component.scss',
})
export class UploadFormComponent {
  private readonly destroyRef = inject(DestroyRef);

  readonly isLoading = input.required<boolean>();

  readonly fileSelected = output<File>();
  readonly fileRemoved = output<void>();
  readonly submitted = output<ExtractionFormat>();

  readonly format = signal<ExtractionFormat>('checklist');
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly fileSizeError = signal<string | null>(null);

  constructor() {
    this.destroyRef.onDestroy(() => {
      const url = this.previewUrl();
      if (url) URL.revokeObjectURL(url);
    });
  }

  onFileChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    if (!file) return;
    this.fileSizeError.set(null);
    const oldUrl = this.previewUrl();
    if (oldUrl) URL.revokeObjectURL(oldUrl);
    this.previewUrl.set(URL.createObjectURL(file));
    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }

  onRemoveFile(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
    this.previewUrl.set(null);
    this.selectedFile.set(null);
    this.fileSizeError.set(null);
    this.fileRemoved.emit();
  }

  onSubmit(): void {
    const file = this.selectedFile();
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      this.fileSizeError.set('Arquivo muito grande. Máximo 10 MB.');
      return;
    }
    this.fileSizeError.set(null);
    this.submitted.emit(this.format());
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
