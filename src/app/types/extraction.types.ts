export enum ExtractionFormat {
  Asterisk = 'asterisk',
  Checklist = 'checklist',
  Simple = 'simple',
  Excel = 'excel',
}

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

// ─── Histórico ──────────────────────────────────────────────────────────────────
export interface HistoryItem {
  id: string;
  position: number;
  name: string;
  quantity: number;
  unit: string;
  price: number | null;
}

export interface HistoryEntry {
  id: string;
  created_at: string;
  title: string | null;
  raw_text: string;
  total_items: number;
  format: ExtractionFormat;
  elapsed_seconds: number;
  file_size_bytes: number;
  input_tokens: number;
  output_tokens: number;
  user_id: string | null;
  extraction_items: HistoryItem[];
}

export interface HistoryResult {
  success: boolean;
  count: number;
  total: number;
  limit: number;
  offset: number;
  history: HistoryEntry[];
}

export interface DeleteResult {
  success: boolean;
  id: string;
}
