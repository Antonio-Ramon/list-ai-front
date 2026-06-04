import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ExtractionError, ExtractionFormat, ExtractionItem } from './types/extraction.types';
import { ExtractionService } from './services/extraction.service';
import { UploadFormComponent } from './components/upload-form/upload-form.component';
import { ResultCardComponent } from './components/result-card/result-card.component';
import { ErrorMessageComponent } from './components/error-message/error-message.component';

export type AppState = 'idle' | 'file-selected' | 'loading' | 'success' | 'error';

const LOADING_MESSAGES = [
  'Recebendo imagem da nota fiscal...',
  'Ajustando foco e contraste...',
  'Localizando área de itens...',
  'Lendo linhas da nota...',
  'Identificando nomes dos produtos...',
  'Extraindo quantidades...',
  'Reconhecendo unidades de medida...',
  'Separando itens duplicados...',
  'Consultando modelo de IA...',
  'Estruturando a lista...',
  'Revisando dados extraídos...',
  'Ordenando os itens...',
  'Quase pronto...',
];

@Component({
  selector: 'la-root',
  standalone: true,
  imports: [UploadFormComponent, ResultCardComponent, ErrorMessageComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly extractionService = inject(ExtractionService);
  private readonly destroyRef = inject(DestroyRef);
  private loadingTimer: ReturnType<typeof setInterval> | null = null;

  readonly state = signal<AppState>('idle');
  readonly items = signal<ExtractionItem[]>([]);
  readonly resultText = signal<string>('');
  readonly errorMessage = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasResult = computed(() => this.state() === 'success');
  readonly hasError = computed(() => this.state() === 'error');

  private readonly loadingMsgIndex = signal(0);
  readonly loadingMessage = computed(() => LOADING_MESSAGES[this.loadingMsgIndex()]);

  constructor() {
    effect(() => {
      if (this.isLoading()) {
        this.loadingMsgIndex.set(0);
        this.loadingTimer = setInterval(() => {
          this.loadingMsgIndex.update(i => (i + 1) % LOADING_MESSAGES.length);
        }, 2500);
      } else {
        if (this.loadingTimer !== null) {
          clearInterval(this.loadingTimer);
          this.loadingTimer = null;
        }
      }
    });

    this.destroyRef.onDestroy(() => {
      if (this.loadingTimer !== null) clearInterval(this.loadingTimer);
    });
  }

  onFileSelected(file: File): void {
    this.selectedFile.set(file);
    this.errorMessage.set(null);
    this.state.set('file-selected');
  }

  onFileRemoved(): void {
    this.selectedFile.set(null);
    this.items.set([]);
    this.resultText.set('');
    this.errorMessage.set(null);
    this.state.set('idle');
  }

  onBack(): void {
    this.selectedFile.set(null);
    this.items.set([]);
    this.resultText.set('');
    this.errorMessage.set(null);
    this.state.set('idle');
  }

  onSubmit(format: ExtractionFormat): void {
    const file = this.selectedFile();
    if (!file) return;
    this.state.set('loading');
    this.extractionService
      .extract(file, format)
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
