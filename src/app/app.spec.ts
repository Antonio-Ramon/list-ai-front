import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { App } from './app';
import { ExtractionService } from './services/extraction.service';

describe('App', () => {
  let mockExtractionService: { extract: ReturnType<typeof vi.fn> };

  beforeEach(async () => {
    mockExtractionService = { extract: vi.fn() };

    await TestBed.configureTestingModule({
      imports: [App],
      providers: [
        { provide: ExtractionService, useValue: mockExtractionService },
      ],
    }).compileComponents();
  });

  it('should create the app', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app).toBeTruthy();
  });

  it('should render the app-container wrapper', async () => {
    const fixture = TestBed.createComponent(App);
    await fixture.whenStable();
    const compiled = fixture.nativeElement as HTMLElement;
    expect(compiled.querySelector('.app-container')).toBeTruthy();
  });

  it('estado inicial é idle', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    expect(app.state()).toBe('idle');
    expect(app.selectedFile()).toBeNull();
    expect(app.errorMessage()).toBeNull();
    expect(app.isLoading()).toBe(false);
    expect(app.hasResult()).toBe(false);
    expect(app.hasError()).toBe(false);
  });

  it('onFileSelected → state file-selected, selectedFile preenchido', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });

    app.onFileSelected(file);

    expect(app.state()).toBe('file-selected');
    expect(app.selectedFile()).toBe(file);
    expect(app.errorMessage()).toBeNull();
  });

  it('onFileSelected em estado error limpa errorMessage', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    app['state'].set('error');
    app['errorMessage'].set('Algo deu errado. Tente novamente.');

    app.onFileSelected(new File(['data'], 'nova.jpg'));

    expect(app.state()).toBe('file-selected');
    expect(app.errorMessage()).toBeNull();
  });

  it('onSubmit → state loading, ExtractionService chamado', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });
    mockExtractionService.extract.mockReturnValue(of({ success: true, items: [], text: '' }));

    app.onFileSelected(file);
    app.onSubmit();

    expect(mockExtractionService.extract).toHaveBeenCalledWith(file);
  });

  it('resposta de sucesso → state success, items e resultText preenchidos', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    const result = {
      success: true,
      items: [{ name: 'Leite', quantity: 1, unit: 'L' }],
      text: '1x Leite',
    };
    mockExtractionService.extract.mockReturnValue(of(result));

    app.onFileSelected(new File(['data'], 'nota.jpg'));
    app.onSubmit();

    expect(app.state()).toBe('success');
    expect(app.items()).toEqual(result.items);
    expect(app.resultText()).toBe('1x Leite');
    expect(app.hasResult()).toBe(true);
    expect(app.errorMessage()).toBeNull();
  });

  it('resposta de erro → state error, errorMessage preenchido', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;
    mockExtractionService.extract.mockReturnValue(
      of({ error: 'Algo deu errado. Tente novamente.' })
    );

    app.onFileSelected(new File(['data'], 'nota.jpg'));
    app.onSubmit();

    expect(app.state()).toBe('error');
    expect(app.errorMessage()).toBe('Algo deu errado. Tente novamente.');
    expect(app.hasError()).toBe(true);
  });

  it('onSubmit sem arquivo não faz nada', () => {
    const fixture = TestBed.createComponent(App);
    const app = fixture.componentInstance;

    app.onSubmit();

    expect(mockExtractionService.extract).not.toHaveBeenCalled();
    expect(app.state()).toBe('idle');
  });
});
