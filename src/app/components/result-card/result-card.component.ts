import { Component, inject, input, output, signal } from '@angular/core';
import { MatSnackBar } from '@angular/material/snack-bar';
import { ExtractionItem } from '../../types/extraction.types';

@Component({
  selector: 'la-result-card',
  standalone: true,
  imports: [],
  templateUrl: './result-card.component.html',
  styleUrl: './result-card.component.scss',
})
export class ResultCardComponent {
  private readonly snackBar = inject(MatSnackBar);

  readonly hasResult = input.required<boolean>();
  readonly items = input.required<ExtractionItem[]>();
  readonly text = input.required<string>();

  readonly back = output<void>();

  readonly copied = signal<boolean>(false);

  async copyToClipboard(): Promise<void> {
    try {
      if (!navigator.clipboard) throw new Error('clipboard-unavailable');
      await navigator.clipboard.writeText(this.text());
      this.copied.set(true);
      setTimeout(() => this.copied.set(false), 2_000);
    } catch {
      this.snackBar.open(
        'Não foi possível copiar automaticamente. Selecione o texto manualmente.',
        'OK',
        { duration: 4_000 },
      );
    }
  }

  formatCount(): string {
    return `${this.items().length.toString().padStart(2, '0')} ITENS`;
  }

  formatIndex(index: number): string {
    return (index + 1).toString().padStart(2, '0');
  }
}
