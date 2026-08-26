import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import {
  HttpTestingController,
  provideHttpClientTesting,
} from '@angular/common/http/testing';
import { firstValueFrom } from 'rxjs';
import { ApiStatusService } from './api-status.service';
import { ExtractionService } from './extraction.service';
import { ExtractionResult } from '../types/extraction.types';
import { environment } from '../../environments/environment';

const API_URL = `${environment.apiUrl}/extract?format=checklist`;

describe('ExtractionService', () => {
  let service: ExtractionService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    service = TestBed.inject(ExtractionService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => httpMock.verify());

  it('deve ser criado', () => {
    expect(service).toBeTruthy();
  });

  it('envia POST para a URL correta com campo image', async () => {
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });
    const promise = firstValueFrom(service.extract(file));

    const req = httpMock.expectOne(API_URL);
    expect(req.request.method).toBe('POST');
    const body = req.request.body as FormData;
    expect(body.get('image')).toBe(file);
    req.flush({ success: true, items: [], text: '' });

    await promise;
  });

  it('emite ExtractionResult em caso de sucesso', async () => {
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });
    const result: ExtractionResult = {
      success: true,
      items: [{ name: 'Leite', quantity: 1, unit: 'L' }],
      text: '1x Leite',
    };

    const promise = firstValueFrom(service.extract(file));
    httpMock.expectOne(API_URL).flush(result);
    const res = await promise;

    expect(res).toEqual(result);
  });

  it('emite ExtractionError sem lançar em caso de erro HTTP', async () => {
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });

    const promise = firstValueFrom(service.extract(file));
    httpMock
      .expectOne(API_URL)
      .flush(
        { code: 'INVALID_FILE_TYPE' },
        { status: 422, statusText: 'Unprocessable Entity' }
      );
    const res = await promise;

    expect((res as { error: string }).error).toBe(
      'Formato não suportado. Envie JPEG, PNG ou WEBP.'
    );
  });

  it('avisa que o serviço está fora do ar em erro 5xx', async () => {
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });

    const promise = firstValueFrom(service.extract(file));
    httpMock
      .expectOne(API_URL)
      .flush(null, { status: 500, statusText: 'Internal Server Error' });
    const res = await promise;

    expect((res as { error: string }).error).toBe(
      'O serviço está fora do ar no momento. Tente novamente em instantes.'
    );
  });

  it('emite ExtractionError com mensagem genérica para erro sem código', async () => {
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });

    const promise = firstValueFrom(service.extract(file));
    httpMock
      .expectOne(API_URL)
      .flush({ message: 'algo estranho' }, { status: 422, statusText: 'Unprocessable Entity' });
    const res = await promise;

    expect((res as { error: string }).error).toBe(
      'Algo deu errado. Tente novamente.'
    );
  });

  it('marca a API como desconectada quando a rede falha', async () => {
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });

    const promise = firstValueFrom(service.extract(file));
    httpMock.expectOne(API_URL).error(new ProgressEvent('error'), { status: 0, statusText: '' });
    const res = await promise;

    expect((res as { error: string }).error).toBe(
      'Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.'
    );
    expect(TestBed.inject(ApiStatusService).isOffline()).toBe(true);
  });
});
