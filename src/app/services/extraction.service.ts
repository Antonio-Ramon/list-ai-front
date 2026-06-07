import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, of, TimeoutError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  DeleteResult,
  ExtractionError,
  ExtractionFormat,
  ExtractionResult,
  HistoryResult,
} from '../types/extraction.types';
import { PAGINATION } from '../constants/pagination.constants';
import { mapApiError } from '../utils/error-mapper';
import { HttpParamsService } from './http-params.service';

@Injectable({ providedIn: 'root' })
export class ExtractionService {
  private readonly http = inject(HttpClient);
  private readonly paramsBuilder = inject(HttpParamsService);

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
        catchError((err: HttpErrorResponse | TimeoutError) =>
          of({ error: mapApiError(err) })
        )
      );
  }

  getHistory(
    limit = PAGINATION.limit,
    offset = PAGINATION.offset
  ): Observable<HistoryResult | ExtractionError> {
    const params = this.paramsBuilder.build({ limit, offset });
    return this.http
      .get<HistoryResult>(`${environment.apiUrl}/history`, { params })
      .pipe(
        timeout(30_000),
        catchError((err: HttpErrorResponse | TimeoutError) =>
          of({ error: mapApiError(err) })
        )
      );
  }

  deleteExtraction(id: string): Observable<DeleteResult | ExtractionError> {
    return this.http
      .delete<DeleteResult>(`${environment.apiUrl}/history/${id}`)
      .pipe(
        timeout(30_000),
        catchError((err: HttpErrorResponse | TimeoutError) =>
          of({ error: mapApiError(err) })
        )
      );
  }
}
