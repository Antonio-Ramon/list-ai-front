import { Component, input, output, signal } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { ExtractionFormat } from '../../types/extraction.types';

interface FormatOption {
  id: ExtractionFormat;
  label: string;
  hint: string;
  icon: string;
}

const FORMAT_OPTIONS: FormatOption[] = [
  { id: ExtractionFormat.Checklist, label: 'Checklist', hint: 'Caixas de marcar', icon: 'checklist' },
  { id: ExtractionFormat.Asterisk, label: 'Asterisco', hint: '* item', icon: 'format_list_bulleted' },
  { id: ExtractionFormat.Simple, label: 'Simples', hint: 'Texto puro', icon: 'list' },
  { id: ExtractionFormat.Excel, label: 'Excel', hint: 'Colunas / CSV', icon: 'table_chart' },
];

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

@Component({
  selector: 'la-upload-form',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './upload-form.component.html',
  styleUrl: './upload-form.component.scss',
})
export class UploadFormComponent {
  readonly isLoading = input.required<boolean>();
  readonly selectedFile = input<File | null>(null);
  readonly previewUrl = input<string | null>(null);

  readonly fileSelected = output<File>();
  readonly fileRemoved = output<void>();
  readonly submitted = output<ExtractionFormat>();

  readonly formats = FORMAT_OPTIONS;
  readonly format = signal<ExtractionFormat>(ExtractionFormat.Checklist);
  readonly fileSizeError = signal<string | null>(null);
  readonly isDragging = signal(false);

  onFileChange(event: Event): void {
    const el = event.target as HTMLInputElement;
    const file = el.files?.[0];
    if (!file) return;
    this.fileSizeError.set(null);
    this.fileSelected.emit(file);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    if (this.isLoading()) return;
    this.isDragging.set(true);
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    this.isDragging.set(false);
    if (this.isLoading()) return;
    const file = event.dataTransfer?.files?.[0];
    if (!file) return;
    if (!ACCEPTED_TYPES.includes(file.type)) {
      this.fileSizeError.set('Formato não suportado. Use JPG, PNG ou WEBP.');
      return;
    }
    this.fileSizeError.set(null);
    this.fileSelected.emit(file);
  }

  onRemoveFile(): void {
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
