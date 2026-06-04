import { Component, computed, DestroyRef, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatProgressSpinner } from '@angular/material/progress-spinner';
import { ExtractionError, ExtractionItem } from './types/extraction.types';
import { ExtractionService } from './services/extraction.service';
import { UploadFormComponent } from './components/upload-form/upload-form.component';
import { ResultCardComponent } from './components/result-card/result-card.component';
import { ErrorMessageComponent } from './components/error-message/error-message.component';

export type AppState = 'idle' | 'file-selected' | 'loading' | 'success' | 'error';

@Component({
  selector: 'la-root',
  standalone: true,
  imports: [UploadFormComponent, ResultCardComponent, ErrorMessageComponent, MatProgressSpinner],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly extractionService = inject(ExtractionService);
  private readonly destroyRef = inject(DestroyRef);

  readonly state = signal<AppState>('idle');
  readonly items = signal<ExtractionItem[]>([]);
  readonly resultText = signal<string>('');
  readonly errorMessage = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasResult = computed(() => this.state() === 'success');
  readonly hasError = computed(() => this.state() === 'error');

  onFileSelected(file: File): void {
    this.selectedFile.set(file);
    this.errorMessage.set(null);
    this.state.set('file-selected');
  }

  onSubmit(): void {
    const file = this.selectedFile();
    if (!file) return;
    this.state.set('loading');
    this.extractionService
      .extract(file)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if ('error' in res) {
          this.state.set('error');
          this.errorMessage.set((res as ExtractionError).error);
        } else {
          this.state.set('success');
          this.items.set(res.items);
          this.resultText.set(res.text);
          this.errorMessage.set(null);
        }
      });
  }
}
