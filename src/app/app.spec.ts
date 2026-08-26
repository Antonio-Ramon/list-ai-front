import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { MatSnackBar } from '@angular/material/snack-bar';
import { App } from './app';
import { ApiStatusService } from './services/api-status.service';
import { ExtractionService } from './services/extraction.service';
import { HistoryStore } from './services/history-store.service';
import { ExtractionFormat } from './types/extraction.types';

describe('App', () => {
  let mockExtractionService: { extract: ReturnType<typeof vi.fn> };

  const createApp = () => {
    const fixture = TestBed.createComponent(App);
    return { fixture, app: fixture.componentInstance };
  };

  beforeEach(async () => {
    mockExtractionService = { extract: vi.fn() };

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      writable: true,
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        provideHttpClient(),
        provideHttpClientTesting(),
        { provide: ExtractionService, useValue: mockExtractionService },
        // Stub: o store real dispara um httpResource que deixaria o fixture instável.
        { provide: HistoryStore, useValue: { refresh: vi.fn() } },
        { provide: MatSnackBar, useValue: { open: vi.fn() } },
        provideNoopAnimations(),
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const { app } = createApp();
    expect(app).toBeTruthy();
  });

  it('should render the app-shell wrapper', async () => {
    const { fixture } = createApp();
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-shell')).toBeTruthy();
  });

  it('estado inicial é idle', () => {
    const { app } = createApp();
    expect(app.state()).toBe('idle');
    expect(app.selectedFile()).toBeNull();
    expect(app.errorMessage()).toBeNull();
    expect(app.isLoading()).toBe(false);
    expect(app.hasResult()).toBe(false);
    expect(app.hasError()).toBe(false);
  });

  it('onFileSelected → state file-selected, selectedFile preenchido', () => {
    const { app } = createApp();
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });

    app.onFileSelected(file);

    expect(app.state()).toBe('file-selected');
    expect(app.selectedFile()).toBe(file);
    expect(app.errorMessage()).toBeNull();
  });

  it('onFileSelected em estado error limpa errorMessage', () => {
    const { app } = createApp();
    app['state'].set('error');
    app['errorMessage'].set('Algo deu errado. Tente novamente.');

    app.onFileSelected(new File(['data'], 'nova.jpg'));

    expect(app.state()).toBe('file-selected');
    expect(app.errorMessage()).toBeNull();
  });

  it('onSubmit → ExtractionService chamado com arquivo e formato', () => {
    const { app } = createApp();
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });
    mockExtractionService.extract.mockReturnValue(of({ success: true, items: [], text: '' }));

    app.onFileSelected(file);
    app.onSubmit(ExtractionFormat.Checklist);

    expect(mockExtractionService.extract).toHaveBeenCalledWith(file, ExtractionFormat.Checklist);
  });

  it('resposta de sucesso → state success, items e resultText preenchidos', () => {
    const { app } = createApp();
    const result = {
      success: true,
      items: [{ name: 'Leite', quantity: 1, unit: 'L' }],
      text: '1x Leite',
    };
    mockExtractionService.extract.mockReturnValue(of(result));

    app.onFileSelected(new File(['data'], 'nota.jpg'));
    app.onSubmit(ExtractionFormat.Checklist);

    expect(app.state()).toBe('success');
    expect(app.items()).toEqual(result.items);
    expect(app.resultText()).toBe('1x Leite');
    expect(app.hasResult()).toBe(true);
    expect(app.errorMessage()).toBeNull();
  });

  it('resposta de erro → state error, errorMessage preenchido', () => {
    const { app } = createApp();
    mockExtractionService.extract.mockReturnValue(
      of({ error: 'Algo deu errado. Tente novamente.' })
    );

    app.onFileSelected(new File(['data'], 'nota.jpg'));
    app.onSubmit(ExtractionFormat.Checklist);

    expect(app.state()).toBe('error');
    expect(app.errorMessage()).toBe('Algo deu errado. Tente novamente.');
    expect(app.hasError()).toBe(true);
  });

  it('onSubmit sem arquivo não faz nada', () => {
    const { app } = createApp();

    app.onSubmit(ExtractionFormat.Checklist);

    expect(mockExtractionService.extract).not.toHaveBeenCalled();
    expect(app.state()).toBe('idle');
  });

  it('estado idle: loading, card e erro ocultos no DOM (AC-1)', async () => {
    const { fixture } = createApp();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.loading-bop')).toBeNull();
    expect(fixture.nativeElement.querySelector('.result')).toBeNull();
    expect(fixture.nativeElement.querySelector('.error-message')).toBeNull();
  });

  it('estado loading: indicador visível com role e aria-label (AC-2/3)', () => {
    const { fixture, app } = createApp();
    app['state'].set('loading');
    fixture.detectChanges();
    const container = fixture.nativeElement.querySelector('.loading-bop') as HTMLElement;
    expect(container).toBeTruthy();
    expect(container.getAttribute('role')).toBe('status');
    expect(container.getAttribute('aria-label')).toBe('Processando nota fiscal');
  });

  it('estado loading: mensagem de progresso visível (AC-2)', () => {
    const { fixture, app } = createApp();
    app['state'].set('loading');
    fixture.detectChanges();
    const label = fixture.nativeElement.querySelector('.loading-bop__message') as HTMLElement;
    expect(label).toBeTruthy();
    expect(label.textContent!.trim()).toBe('Recebendo imagem da nota fiscal...');
  });

  it('estado success: card visível, loading oculto (AC-4)', () => {
    const { fixture, app } = createApp();
    app['state'].set('success');
    app['items'].set([{ name: 'Leite', quantity: 1, unit: 'L' }]);
    app['resultText'].set('1 L Leite');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.result')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.loading-bop')).toBeNull();
  });

  it('estado error: mensagem visível, loading oculto (AC-5)', () => {
    const { fixture, app } = createApp();
    app['state'].set('error');
    app['errorMessage'].set('Algo deu errado. Tente novamente.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-message')).toBeTruthy();
    expect(fixture.nativeElement.querySelector('.loading-bop')).toBeNull();
  });

  // ─── Status da API ─────────────────────────────────────────────────────────
  describe('card de status da API', () => {
    it('mostra "API desconectada" e botão de retry quando a API cai', () => {
      const { fixture } = createApp();
      TestBed.inject(ApiStatusService).reportOffline();
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.status-card') as HTMLElement;
      expect(card.classList).toContain('status-card--offline');
      expect(card.textContent).toContain('API desconectada');
      expect(card.querySelector('.status-card__retry')).toBeTruthy();
    });

    it('mostra "API conectada" sem retry quando a API responde', () => {
      const { fixture } = createApp();
      TestBed.inject(ApiStatusService).reportOnline();
      fixture.detectChanges();

      const card = fixture.nativeElement.querySelector('.status-card') as HTMLElement;
      expect(card.classList).not.toContain('status-card--offline');
      expect(card.textContent).toContain('API conectada');
      expect(card.querySelector('.status-card__retry')).toBeNull();
    });
  });
});
