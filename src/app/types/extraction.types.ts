export type ExtractionFormat = 'asterisk' | 'checklist';

export interface ExtractionItem {
  name: string;
  quantity: number;
  unit: string;
}

export interface ExtractionResult {
  success: boolean;
  items: ExtractionItem[];
  text: string;
}

export interface ExtractionError {
  error: string;
}
