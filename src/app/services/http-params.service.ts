import { Injectable } from '@angular/core';
import { HttpParams } from '@angular/common/http';

type ParamValue = string | number | boolean | null | undefined;

/**
 * Util genérico para montar `HttpParams` a partir de um objeto.
 * Ignora valores `null`, `undefined` e string vazia.
 */
@Injectable({ providedIn: 'root' })
export class HttpParamsService {
  build<T extends Record<string, ParamValue>>(source: T): HttpParams {
    let params = new HttpParams();
    for (const [key, value] of Object.entries(source)) {
      if (value !== null && value !== undefined && value !== '') {
        params = params.set(key, value);
      }
    }
    return params;
  }
}
