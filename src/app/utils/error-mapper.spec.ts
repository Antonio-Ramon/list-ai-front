import { HttpErrorResponse } from '@angular/common/http';
import { TimeoutError } from 'rxjs';
import { mapApiError } from './error-mapper';

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

  it('retorna fallback para TimeoutError', () => {
    expect(mapApiError(new TimeoutError())).toBe('Algo deu errado. Tente novamente.');
  });
});
