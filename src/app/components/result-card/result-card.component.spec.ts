import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MatSnackBar } from '@angular/material/snack-bar';
import { vi } from 'vitest';
import { ExtractionItem } from '../../types/extraction.types';
import { ResultCardComponent } from './result-card.component';

const DEFAULT_ITEMS: ExtractionItem[] = [
  { name: 'Arroz Tipo 1', quantity: 5, unit: 'kg' },
  { name: 'Feijão Carioca', quantity: 2, unit: 'kg' },
];

describe('ResultCardComponent', () => {
  let mockSnackBar: { open: ReturnType<typeof vi.fn> };

  function createComponent(
    hasResult = true,
    items: ExtractionItem[] = DEFAULT_ITEMS,
    text = '5 kg Arroz Tipo 1\n2 kg Feijão Carioca',
  ) {
    const fixture: ComponentFixture<ResultCardComponent> = TestBed.createComponent(ResultCardComponent);
    fixture.componentRef.setInput('hasResult', hasResult);
    fixture.componentRef.setInput('items', items);
    fixture.componentRef.setInput('text', text);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  beforeEach(async () => {
    mockSnackBar = { open: vi.fn() };

    Object.defineProperty(navigator, 'clipboard', {
      value: { writeText: vi.fn() },
      writable: true,
      configurable: true,
    });

    await TestBed.configureTestingModule({
      imports: [ResultCardComponent],
      providers: [{ provide: MatSnackBar, useValue: mockSnackBar }],
    }).compileComponents();
  });

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('card não renderizado quando hasResult=false (AC-1)', () => {
    const { fixture } = createComponent(false);
    expect(fixture.nativeElement.querySelector('.result-card')).toBeNull();
  });

  it('card renderizado quando hasResult=true (AC-1/2)', () => {
    const { fixture } = createComponent(true);
    expect(fixture.nativeElement.querySelector('.result-card')).toBeTruthy();
  });

  it('header exibe "EXTRAÇÃO CONCLUÍDA" (AC-3)', () => {
    const { fixture } = createComponent();
    const label = fixture.nativeElement.querySelector('.result-card__label') as HTMLElement;
    expect(label.textContent!.trim()).toBe('EXTRAÇÃO CONCLUÍDA');
  });

  it('count-badge exibe total formatado com zero-padding (AC-3)', () => {
    const { fixture } = createComponent(true, DEFAULT_ITEMS);
    const badge = fixture.nativeElement.querySelector('.result-card__count-badge') as HTMLElement;
    expect(badge.textContent!.trim()).toBe('02 ITENS');
  });

  it('items renderizados com índice, nome e qty badge (AC-4)', () => {
    const { fixture } = createComponent();
    const rows = fixture.nativeElement.querySelectorAll('.item-row') as NodeListOf<HTMLElement>;
    expect(rows.length).toBe(2);

    const firstIndex = rows[0].querySelector('.item-row__index') as HTMLElement;
    const firstName = rows[0].querySelector('.item-row__name') as HTMLElement;
    const firstQty = rows[0].querySelector('.item-row__qty') as HTMLElement;

    expect(firstIndex.textContent!.trim()).toBe('01');
    expect(firstName.textContent!.trim()).toBe('Arroz Tipo 1');
    expect(firstQty.textContent!.trim()).toBe('5 kg');
  });

  it('aria-live="polite" presente no container do card (AC-6)', () => {
    const { fixture } = createComponent();
    const card = fixture.nativeElement.querySelector('.result-card') as HTMLElement;
    expect(card.getAttribute('aria-live')).toBe('polite');
  });

  it('copyToClipboard chama navigator.clipboard.writeText com o texto do input (AC-7)', async () => {
    const writeTextSpy = vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const { component } = createComponent(true, DEFAULT_ITEMS, 'meu texto');
    await component.copyToClipboard();
    expect(writeTextSpy).toHaveBeenCalledWith('meu texto');
    writeTextSpy.mockRestore();
  });

  it('copied() fica true após cópia bem-sucedida (AC-8)', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const { component, fixture } = createComponent();
    await component.copyToClipboard();
    fixture.detectChanges();
    expect(component.copied()).toBe(true);
  });

  it('botão exibe "COPIADO!" após cópia (AC-8)', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const { component, fixture } = createComponent();
    await component.copyToClipboard();
    fixture.detectChanges();
    const btn = fixture.nativeElement.querySelector('.btn-copy') as HTMLButtonElement;
    expect(btn.textContent!.trim()).toBe('COPIADO!');
  });

  it('copied() reverte para false após 2 s (AC-8)', async () => {
    vi.useFakeTimers();
    vi.spyOn(navigator.clipboard, 'writeText').mockResolvedValue(undefined);
    const { component, fixture } = createComponent();
    await component.copyToClipboard();
    fixture.detectChanges();
    expect(component.copied()).toBe(true);

    vi.advanceTimersByTime(2_000);
    fixture.detectChanges();
    expect(component.copied()).toBe(false);
    vi.useRealTimers();
  });

  it('fallback MatSnackBar quando writeText rejeita (AC-9)', async () => {
    vi.spyOn(navigator.clipboard, 'writeText').mockRejectedValue(new Error('denied'));
    const { component } = createComponent();
    await component.copyToClipboard();
    expect(mockSnackBar.open).toHaveBeenCalledWith(
      'Não foi possível copiar automaticamente. Selecione o texto manualmente.',
      'OK',
      expect.objectContaining({ duration: 4_000 }),
    );
  });

  it('fallback MatSnackBar quando navigator.clipboard é undefined (AC-9)', async () => {
    const original = navigator.clipboard;
    Object.defineProperty(navigator, 'clipboard', { value: undefined, writable: true });
    const { component } = createComponent();
    await component.copyToClipboard();
    expect(mockSnackBar.open).toHaveBeenCalled();
    Object.defineProperty(navigator, 'clipboard', { value: original, writable: true });
  });

  it('formatCount formata corretamente (AC-3)', () => {
    const { component } = createComponent(true, DEFAULT_ITEMS);
    expect(component.formatCount()).toBe('02 ITENS');
  });

  it('formatCount com 7 itens retorna "07 ITENS"', () => {
    const items: ExtractionItem[] = Array.from({ length: 7 }, (_, i) => ({
      name: `Item ${i}`, quantity: 1, unit: 'un',
    }));
    const { component } = createComponent(true, items);
    expect(component.formatCount()).toBe('07 ITENS');
  });

  it('formatIndex formata corretamente (AC-4)', () => {
    const { component } = createComponent();
    expect(component.formatIndex(0)).toBe('01');
    expect(component.formatIndex(9)).toBe('10');
    expect(component.formatIndex(99)).toBe('100');
  });
});
