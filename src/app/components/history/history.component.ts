import { Component, computed, DestroyRef, inject, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog } from '@angular/material/dialog';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExtractionService } from '../../services/extraction.service';
import { HistoryStore } from '../../services/history-store.service';
import { ExtractionFormat, HistoryEntry } from '../../types/extraction.types';
import {
  DeleteDialogComponent,
  DeleteDialogData,
} from '../delete-dialog/delete-dialog.component';

const FORMAT_LABELS: Record<ExtractionFormat, string> = {
  [ExtractionFormat.Checklist]: 'Checklist',
  [ExtractionFormat.Asterisk]: 'Asterisco',
  [ExtractionFormat.Simple]: 'Simples',
  [ExtractionFormat.Excel]: 'Excel',
};

const FORMAT_ICONS: Record<ExtractionFormat, string> = {
  [ExtractionFormat.Checklist]: 'checklist',
  [ExtractionFormat.Asterisk]: 'format_list_bulleted',
  [ExtractionFormat.Simple]: 'list',
  [ExtractionFormat.Excel]: 'table_chart',
};

interface FormatFilter {
  id: ExtractionFormat | 'all';
  label: string;
}

const FILTERS: FormatFilter[] = [
  { id: 'all', label: 'Todos' },
  { id: ExtractionFormat.Checklist, label: 'Checklist' },
  { id: ExtractionFormat.Asterisk, label: 'Asterisco' },
  { id: ExtractionFormat.Simple, label: 'Simples' },
  { id: ExtractionFormat.Excel, label: 'Excel' },
];

/** Linha de histórico já formatada para exibição. */
export interface HistoryRow {
  entry: HistoryEntry;
  title: string;
  dateLabel: string;
  preview: string;
  formatLabel: string;
  formatIcon: string;
  group: string;
}

interface HistoryGroup {
  group: string;
  rows: HistoryRow[];
}

const GROUP_ORDER = ['Hoje', 'Ontem', 'Esta semana', 'Mais antigas'];

@Component({
  selector: 'la-history',
  standalone: true,
  imports: [MatIconModule],
  templateUrl: './history.component.html',
  styleUrl: './history.component.scss',
})
export class HistoryComponent {
  private readonly extractionService = inject(ExtractionService);
  private readonly store = inject(HistoryStore);
  private readonly destroyRef = inject(DestroyRef);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly newScan = output<void>();
  readonly viewEntry = output<HistoryEntry>();

  // Estado vem do cache reativo (httpResource), persistente entre visitas.
  readonly rows = computed<HistoryRow[]>(() => this.store.entries().map((entry) => this.toRow(entry)));
  readonly total = this.store.total;
  readonly loading = this.store.loading;
  readonly loadingMore = this.store.loadingMore;
  readonly error = this.store.errorMessage;

  readonly search = signal<string>('');
  readonly activeFilter = signal<ExtractionFormat | 'all'>('all');

  readonly filters = FILTERS;

  private readonly normalizedSearch = computed(() => this.search().trim().toLowerCase());

  readonly visibleRows = computed(() => {
    const q = this.normalizedSearch();
    const filter = this.activeFilter();
    return this.rows().filter((row) => {
      const matchesFilter = filter === 'all' || row.entry.format === filter;
      const matchesSearch =
        !q ||
        row.title.toLowerCase().includes(q) ||
        row.preview.toLowerCase().includes(q) ||
        row.dateLabel.toLowerCase().includes(q);
      return matchesFilter && matchesSearch;
    });
  });

  readonly groups = computed<HistoryGroup[]>(() => {
    const map = new Map<string, HistoryRow[]>();
    for (const row of this.visibleRows()) {
      const bucket = map.get(row.group) ?? [];
      bucket.push(row);
      map.set(row.group, bucket);
    }
    return GROUP_ORDER.filter((g) => map.has(g)).map((g) => ({ group: g, rows: map.get(g)! }));
  });

  readonly totalItems = computed(() => this.rows().reduce((sum, r) => sum + r.entry.total_items, 0));

  readonly hasMore = this.store.hasMore;

  load(): void {
    this.store.refresh();
  }

  loadMore(): void {
    this.store.loadMore();
  }

  openDelete(row: HistoryRow, event: MouseEvent): void {
    event.stopPropagation();
    const data: DeleteDialogData = {
      totalItems: row.entry.total_items,
      dateLabel: row.dateLabel,
      preview: row.preview,
      format: row.entry.format,
    };
    const ref = this.dialog.open(DeleteDialogComponent, {
      data,
      panelClass: 'la-dialog-panel',
      backdropClass: 'la-dialog-backdrop',
      width: '420px',
      maxWidth: '92vw',
      autoFocus: false,
    });
    ref
      .afterClosed()
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((confirmed) => {
        if (confirmed) this.delete(row);
      });
  }

  private delete(row: HistoryRow): void {
    this.extractionService
      .deleteExtraction(row.entry.id)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((res) => {
        if ('error' in res) {
          this.snackBar.open(res.error, 'OK', { duration: 4_000 });
          return;
        }
        this.store.markDeleted(row.entry.id);
        this.snackBar.open('Nota excluída.', 'OK', { duration: 3_000 });
      });
  }

  onFilter(id: ExtractionFormat | 'all'): void {
    this.activeFilter.set(id);
  }

  onSearch(value: string): void {
    this.search.set(value);
  }

  // ─── Mapeamento de dados ─────────────────────────────────────────────────────
  private toRow(entry: HistoryEntry): HistoryRow {
    return {
      entry,
      title: entry.title?.trim() || '-',
      dateLabel: this.formatDate(entry.created_at),
      preview: this.buildPreview(entry),
      formatLabel: FORMAT_LABELS[entry.format] ?? entry.format,
      formatIcon: FORMAT_ICONS[entry.format] ?? 'list',
      group: this.groupFor(entry.created_at),
    };
  }

  private buildPreview(entry: HistoryEntry): string {
    const names = [...entry.extraction_items]
      .sort((a, b) => a.position - b.position)
      .map((i) => i.name)
      .filter(Boolean);
    if (!names.length) return `${entry.total_items} itens`;
    const preview = names.slice(0, 3).join(', ');
    return names.length > 3 ? `${preview}…` : preview;
  }

  private formatDate(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return '';
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: false,
    }).format(date).replace(',', '');
  }

  private groupFor(iso: string): string {
    const date = new Date(iso);
    if (Number.isNaN(date.getTime())) return 'Mais antigas';
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const dayMs = 86_400_000;
    const diffDays = Math.floor((startOfToday.getTime() - date.getTime()) / dayMs);
    if (diffDays <= 0) return 'Hoje';
    if (diffDays === 1) return 'Ontem';
    if (diffDays < 7) return 'Esta semana';
    return 'Mais antigas';
  }
}
