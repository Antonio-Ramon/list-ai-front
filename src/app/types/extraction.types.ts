export type ExtractionFormat = 'asterisk' | 'checklist' | 'simple' | 'excel';

export interface ExtractionItem {
  name: string;
  quantity: number;
  unit: string;
  price?: number;
}

export interface ExtractionResult {
  success: boolean;
  items: ExtractionItem[];
  text: string;
  total_items?: number;
  elapsed_seconds?: number;
}

export interface ExtractionError {
  error: string;
}
