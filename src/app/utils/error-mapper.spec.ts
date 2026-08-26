import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { isConnectionError, mapApiError } from './error-mapper';

describe('mapApiError', () => {
  const makeErr = (code: string) =>
    new HttpErrorResponse({ error: { code }, status: 400 });

  it('mapeia INVALID_FILE_TYPE', () => {
    expect(mapApiError(makeErr('INVALID_FILE_TYPE'))).toBe(
      'Formato não suportado. Envie JPEG, PNG ou WEBP.'
    );
  });

  it('mapeia FILE_TOO_LARGE', () => {
    expect(mapApiError(makeErr('FILE_TOO_LARGE'))).toBe(
      'Arquivo muito grande. Máximo 10 MB.'
    );
  });

  it('mapeia NO_ITEMS_FOUND', () => {
    expect(mapApiError(makeErr('NO_ITEMS_FOUND'))).toBe(
      'Não encontramos itens nessa imagem. Tente uma foto mais nítida.'
    );
  });

  it('mapeia RATE_LIMIT_EXCEEDED', () => {
    expect(mapApiError(makeErr('RATE_LIMIT_EXCEEDED'))).toBe(
      'Limite atingido. Aguarde 1 minuto e tente novamente.'
    );
  });

  it('retorna fallback para código desconhecido', () => {
    expect(mapApiError(makeErr('UNKNOWN_CODE'))).toBe(
      'Algo deu errado. Tente novamente.'
    );
  });

  it('avisa sobre conexão quando o status é 0 (rede/CORS)', () => {
    expect(mapApiError(new HttpErrorResponse({ status: 0 }))).toBe(
      'Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.'
    );
  });

  it('avisa sobre serviço fora do ar em 404', () => {
    expect(mapApiError(new HttpErrorResponse({ status: 404 }))).toBe(
      'O serviço está fora do ar no momento. Tente novamente em instantes.'
    );
  });

  it('avisa sobre serviço fora do ar em 5xx', () => {
    expect(mapApiError(new HttpErrorResponse({ status: 503 }))).toBe(
      'O serviço está fora do ar no momento. Tente novamente em instantes.'
    );
  });

  it('mapeia TimeoutError', () => {
    expect(mapApiError(new TimeoutError())).toBe(
      'O servidor demorou demais para responder. Tente novamente.'
    );
  });

  it('desembrulha erro encapsulado pelo resource (cause)', () => {
    const wrapped = new Error('wrapped', { cause: new HttpErrorResponse({ status: 0 }) });
    expect(mapApiError(wrapped)).toBe(
      'Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.'
    );
  });
});

describe('isConnectionError', () => {
  it('é verdadeiro para falha de rede, 404 e 5xx', () => {
    expect(isConnectionError(new HttpErrorResponse({ status: 0 }))).toBe(true);
    expect(isConnectionError(new HttpErrorResponse({ status: 404 }))).toBe(true);
    expect(isConnectionError(new HttpErrorResponse({ status: 500 }))).toBe(true);
    expect(isConnectionError(new TimeoutError())).toBe(true);
  });

  it('é falso para erro de negócio — o servidor respondeu', () => {
    const err = new HttpErrorResponse({ error: { code: 'FILE_TOO_LARGE' }, status: 400 });
    expect(isConnectionError(err)).toBe(false);
    expect(isConnectionError(new HttpErrorResponse({ status: 429 }))).toBe(false);
  });
});
