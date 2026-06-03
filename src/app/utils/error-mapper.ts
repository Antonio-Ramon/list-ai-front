import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

const ERROR_MAP: Record<string, string> = {
  INVALID_FILE_TYPE: 'Formato não suportado. Envie JPEG, PNG ou WEBP.',
  FILE_TOO_LARGE: 'Arquivo muito grande. Máximo 10 MB.',
  NO_ITEMS_FOUND: 'Não encontramos itens nessa imagem. Tente uma foto mais nítida.',
  RATE_LIMIT_EXCEEDED: 'Limite atingido. Aguarde 1 minuto e tente novamente.',
};

const GENERIC_ERROR = 'Algo deu errado. Tente novamente.';

export function mapApiError(err: HttpErrorResponse | TimeoutError): string {
  if (err instanceof TimeoutError) return GENERIC_ERROR;
  return ERROR_MAP[(err as HttpErrorResponse).error?.code] ?? GENERIC_ERROR;
}
