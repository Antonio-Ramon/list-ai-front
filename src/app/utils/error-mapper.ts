import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';

/** Erros que a API devolve com `code` no corpo da resposta. */
const ERROR_MAP: Record<string, string> = {
  INVALID_FILE_TYPE: 'Formato não suportado. Envie JPEG, PNG ou WEBP.',
  FILE_TOO_LARGE: 'Arquivo muito grande. Máximo 10 MB.',
  NO_ITEMS_FOUND: 'Não encontramos itens nessa imagem. Tente uma foto mais nítida.',
  RATE_LIMIT_EXCEEDED: 'Limite atingido. Aguarde 1 minuto e tente novamente.',
};

const GENERIC_ERROR = 'Algo deu errado. Tente novamente.';
const OFFLINE_ERROR = 'Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.';
const UNAVAILABLE_ERROR = 'O serviço está fora do ar no momento. Tente novamente em instantes.';
const TIMEOUT_ERROR = 'O servidor demorou demais para responder. Tente novamente.';

/**
 * Resources do Angular embrulham erros que não são `Error` (`ResourceWrappedError`),
 * guardando o original em `cause`. Desembrulha até achar o `HttpErrorResponse`.
 */
function unwrap(err: unknown): unknown {
  let current = err;
  for (let depth = 0; depth < 3; depth++) {
    if (current instanceof HttpErrorResponse || current instanceof TimeoutError) return current;
    const cause = (current as { cause?: unknown } | null)?.cause;
    if (cause == null) return current;
    current = cause;
  }
  return current;
}

/** `true` quando a falha indica servidor inalcançável — não um erro de negócio. */
export function isConnectionError(raw: unknown): boolean {
  const err = unwrap(raw);
  if (err instanceof TimeoutError) return true;
  if (!(err instanceof HttpErrorResponse)) return false;
  // status 0: rede caiu, DNS falhou, CORS bloqueou ou requisição foi abortada.
  // 404/5xx sem `code` conhecido: a aplicação não está de pé no host.
  return err.status === 0 || err.status === 404 || err.status >= 500;
}

export function mapApiError(raw: unknown): string {
  const err = unwrap(raw);
  if (err instanceof TimeoutError) return TIMEOUT_ERROR;
  if (!(err instanceof HttpErrorResponse)) return GENERIC_ERROR;

  const mapped = ERROR_MAP[err.error?.code];
  if (mapped) return mapped;

  if (err.status === 0) return OFFLINE_ERROR;
  if (err.status === 404 || err.status >= 500) return UNAVAILABLE_ERROR;
  return GENERIC_ERROR;
}
