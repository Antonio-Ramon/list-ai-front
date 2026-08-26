import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, TimeoutError, tap } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  DeleteResult,
  ExtractionError,
  ExtractionFormat,
  ExtractionResult,
} from '../types/extraction.types';
import { isConnectionError, mapApiError } from '../utils/error-mapper';
import { ApiStatusService } from './api-status.service';

@Injectable({ providedIn: 'root' })
export class ExtractionService {
  private readonly http = inject(HttpClient);
  private readonly apiStatus = inject(ApiStatusService);

  extract(file: File, format: ExtractionFormat = ExtractionFormat.Checklist): Observable<ExtractionResult | ExtractionError> {
    const form = new FormData();
    form.append('image', file);
    return this.http
      .post<ExtractionResult>(
        `${environment.apiUrl}/extract?format=${format}`,
        form
      )
      .pipe(
        timeout(60_000),
        tap(() => this.apiStatus.reportOnline()),
        catchError((err: HttpErrorResponse | TimeoutError) => this.toError(err))
      );
  }

  deleteExtraction(id: string): Observable<DeleteResult | ExtractionError> {
    return this.http
      .delete<DeleteResult>(`${environment.apiUrl}/history/${id}`)
      .pipe(
        timeout(30_000),
        tap(() => this.apiStatus.reportOnline()),
        catchError((err: HttpErrorResponse | TimeoutError) => this.toError(err))
      );
  }

  /** Converte a falha em `ExtractionError` e atualiza o status da API. */
  private toError(err: HttpErrorResponse | TimeoutError): Observable<ExtractionError> {
    this.apiStatus.report(isConnectionError(err));
    return of({ error: mapApiError(err) });
  }
}
