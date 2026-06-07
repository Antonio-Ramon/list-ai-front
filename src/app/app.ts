import { Component, computed, DestroyRef, effect, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { ExtractionError, ExtractionFormat, ExtractionItem, HistoryEntry } from './types/extraction.types';
import { ExtractionService } from './services/extraction.service';
import { HistoryStore } from './services/history-store.service';
import { UploadFormComponent } from './components/upload-form/upload-form.component';
import { ResultCardComponent } from './components/result-card/result-card.component';
import { ErrorMessageComponent } from './components/error-message/error-message.component';
import { HistoryComponent } from './components/history/history.component';

export type AppState = 'idle' | 'file-selected' | 'loading' | 'success' | 'error';
export type AppView = 'scan' | 'history';

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
  imports: [MatIconModule, UploadFormComponent, ResultCardComponent, ErrorMessageComponent, HistoryComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  private readonly extractionService = inject(ExtractionService);
  private readonly historyStore = inject(HistoryStore);
  private readonly destroyRef = inject(DestroyRef);
  private loadingTimer: ReturnType<typeof setInterval> | null = null;

  readonly state = signal<AppState>('idle');
  readonly view = signal<AppView>('scan');
  readonly historyDetail = signal<HistoryEntry | null>(null);
  readonly items = signal<ExtractionItem[]>([]);
  readonly resultText = signal<string>('');
  readonly errorMessage = signal<string | null>(null);
  readonly selectedFile = signal<File | null>(null);
  readonly previewUrl = signal<string | null>(null);
  readonly elapsedSeconds = signal<number | null>(null);
  readonly usedFormat = signal<ExtractionFormat | null>(null);

  readonly fileName = computed(() => this.selectedFile()?.name ?? '');

  readonly isLoading = computed(() => this.state() === 'loading');
  readonly hasResult = computed(() => this.state() === 'success');
  readonly hasError = computed(() => this.state() === 'error');

  // Mapeia a entrada de histórico selecionada para os inputs do result-card.
  readonly detailItems = computed<ExtractionItem[]>(() =>
    [...(this.historyDetail()?.extraction_items ?? [])]
      .sort((a, b) => a.position - b.position)
      .map((i) => ({
        name: i.name,
        quantity: i.quantity,
        unit: i.unit,
        price: i.price ?? undefined,
      }))
  );

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
      this.revokePreview();
    });
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) URL.revokeObjectURL(url);
  }

  private reset(): void {
    this.revokePreview();
    this.previewUrl.set(null);
    this.selectedFile.set(null);
    this.items.set([]);
    this.resultText.set('');
    this.elapsedSeconds.set(null);
    this.usedFormat.set(null);
    this.errorMessage.set(null);
    this.state.set('idle');
  }

  onFileSelected(file: File): void {
    this.revokePreview();
    this.previewUrl.set(URL.createObjectURL(file));
    this.selectedFile.set(file);
    this.errorMessage.set(null);
    this.state.set('file-selected');
  }

  onFileRemoved(): void {
    this.reset();
  }

  onBack(): void {
    this.reset();
  }

  // ─── Navegação entre telas ───────────────────────────────────────────────────
  showHistory(): void {
    this.historyDetail.set(null);
    this.view.set('history');
  }

  showScan(): void {
    this.historyDetail.set(null);
    this.view.set('scan');
  }

  onNewScan(): void {
    this.reset();
    this.showScan();
  }

  openHistoryDetail(entry: HistoryEntry): void {
    this.historyDetail.set(entry);
  }

  closeHistoryDetail(): void {
    this.historyDetail.set(null);
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
          this.elapsedSeconds.set(res.elapsed_seconds ?? null);
          this.usedFormat.set(format);
          this.errorMessage.set(null);
          this.historyStore.refresh();
        }
      });
  }
}
