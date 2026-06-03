import { Component, input, output, signal } from '@angular/core';

@Component({
  selector: 'la-upload-form',
  standalone: true,
  imports: [],
  templateUrl: './upload-form.component.html',
  styleUrl: './upload-form.component.scss',
})
export class UploadFormComponent {
  readonly isLoading = input.required<boolean>();

  readonly fileSelected = output<File>();
  readonly submitted = output<void>();

  readonly selectedFile = signal<File | null>(null);
  readonly fileSizeError = signal<string | null>(null);

  onFileChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    if (!file) return;
    this.fileSizeError.set(null);
    this.selectedFile.set(file);
    this.fileSelected.emit(file);
  }

  onSubmit(): void {
    const file = this.selectedFile();
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      this.fileSizeError.set('Arquivo muito grande. Máximo 10 MB.');
      return;
    }
    this.fileSizeError.set(null);
    this.submitted.emit();
  }

  formatFileSize(bytes: number): string {
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }
}
