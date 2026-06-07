import { Component, inject } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';
import { MatDialogModule, MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { ExtractionFormat } from '../../types/extraction.types';

export interface DeleteDialogData {
  /** Quantidade de itens da extração a excluir. */
  totalItems: number;
  /** Data formatada da extração. */
  dateLabel: string;
  /** Prévia dos primeiros itens (ex.: "Arroz, Feijão…"). */
  preview: string;
  /** Formato da lista. */
  format: ExtractionFormat | null;
}

@Component({
  selector: 'la-delete-dialog',
  standalone: true,
  imports: [MatIconModule, MatDialogModule],
  templateUrl: './delete-dialog.component.html',
  styleUrl: './delete-dialog.component.scss',
})
export class DeleteDialogComponent {
  readonly data = inject<DeleteDialogData>(MAT_DIALOG_DATA);
  private readonly dialogRef = inject(MatDialogRef<DeleteDialogComponent, boolean>);

  cancel(): void {
    this.dialogRef.close(false);
  }

  confirm(): void {
    this.dialogRef.close(true);
  }
}
