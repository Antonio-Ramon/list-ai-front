import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { environment } from '../../environments/environment';
import { ExtractionFormat, HistoryEntry, HistoryResult } from '../types/extraction.types';
import { ApiStatusService } from './api-status.service';
import { HistoryStore } from './history-store.service';

const entry = (id: string): HistoryEntry => ({
  id,
  created_at: '2026-08-26T10:00:00.000Z',
  title: 'Mercado',
  raw_text: '- Leite',
  total_items: 1,
  format: ExtractionFormat.Checklist,
  elapsed_seconds: 2,
  file_size_bytes: 1024,
  input_tokens: 10,
  output_tokens: 20,
  user_id: null,
  extraction_items: [{ id: 'i1', position: 1, name: 'Leite', quantity: 1, unit: 'L', price: null }],
});

describe('HistoryStore', () => {
  let store: HistoryStore;
  let apiStatus: ApiStatusService;
  let httpTesting: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    store = TestBed.inject(HistoryStore);
    apiStatus = TestBed.inject(ApiStatusService);
    httpTesting = TestBed.inject(HttpTestingController);
    // Dispara o effect que cria a requisição do resource.
    TestBed.tick();
  });

  afterEach(() => httpTesting.verify());

  /** Deixa o resource assentar a resposta e roda os effects pendentes. */
  const settle = async () => {
    await new Promise((resolve) => setTimeout(resolve));
    TestBed.tick();
  };

  const expectHistoryRequest = () =>
    httpTesting.expectOne((req) => req.url === `${environment.apiUrl}/history`);

  it('expõe as entradas e marca a API como conectada no sucesso', async () => {
    const body: HistoryResult = {
      success: true,
      count: 1,
      total: 1,
      limit: 10,
      offset: 0,
      history: [entry('a')],
    };
    expectHistoryRequest().flush(body);
    await settle();

    expect(store.entries().map((e) => e.id)).toEqual(['a']);
    expect(store.total()).toBe(1);
    expect(store.hasError()).toBe(false);
    expect(store.errorMessage()).toBeNull();
    expect(apiStatus.status()).toBe('online');
  });

  // Regressão: `resource.value()` lança quando a busca falha. Se o store ler o
  // valor sem checar `hasValue()`, a exceção derruba o change detection da tela
  // (contadores em branco, lista vazia, ícones sem estilo).
  it('não lança ao ler entradas/total quando a busca falha', async () => {
    expectHistoryRequest().flush(
      { status: 'error', message: 'Application not found' },
      { status: 404, statusText: 'Not Found' }
    );
    await settle();

    expect(() => store.entries()).not.toThrow();
    expect(() => store.total()).not.toThrow();
    expect(store.entries()).toEqual([]);
    expect(store.total()).toBe(0);
    expect(store.loading()).toBe(false);
  });

  it('expõe mensagem de erro e marca a API como desconectada quando o host está fora do ar', async () => {
    expectHistoryRequest().flush('', { status: 404, statusText: 'Not Found' });
    await settle();

    expect(store.hasError()).toBe(true);
    expect(store.errorMessage()).toBe(
      'O serviço está fora do ar no momento. Tente novamente em instantes.'
    );
    expect(apiStatus.isOffline()).toBe(true);
  });

  it('marca a API como desconectada quando a rede falha (status 0)', async () => {
    expectHistoryRequest().error(new ProgressEvent('error'), { status: 0, statusText: '' });
    await settle();

    expect(apiStatus.isOffline()).toBe(true);
    expect(store.errorMessage()).toBe(
      'Não conseguimos falar com o servidor. Verifique sua conexão e tente de novo.'
    );
  });
});
