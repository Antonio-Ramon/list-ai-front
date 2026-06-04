import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorMessageComponent } from './error-message.component';

describe('ErrorMessageComponent', () => {
  function createComponent(message: string | null = null) {
    const fixture = TestBed.createComponent(ErrorMessageComponent);
    fixture.componentRef.setInput('message', message);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorMessageComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('DOM vazio quando message é null (AC-1)', () => {
    const { fixture } = createComponent(null);
    expect(fixture.nativeElement.querySelector('.error-message')).toBeNull();
  });

  it('DOM renderiza quando message não é null (AC-1)', () => {
    const { fixture } = createComponent('Algo deu errado. Tente novamente.');
    expect(fixture.nativeElement.querySelector('.error-message')).toBeTruthy();
  });

  it('conteúdo de texto exibido corretamente', () => {
    const msg = 'Arquivo muito grande. Máximo 10 MB.';
    const { fixture } = createComponent(msg);
    const el = fixture.nativeElement.querySelector('.error-message') as HTMLElement;
    expect(el.textContent!.trim()).toBe(msg);
  });

  it('role="alert" presente no elemento de erro (AC-3)', () => {
    const { fixture } = createComponent('Erro');
    const el = fixture.nativeElement.querySelector('.error-message') as HTMLElement;
    expect(el.getAttribute('role')).toBe('alert');
  });

  it('exibe mensagem de formato inválido (AC-4)', () => {
    const msg = 'Formato não suportado. Envie JPEG, PNG ou WEBP.';
    const { fixture } = createComponent(msg);
    const el = fixture.nativeElement.querySelector('.error-message') as HTMLElement;
    expect(el.textContent!.trim()).toBe(msg);
  });

  it('exibe mensagem de rate limit (AC-5)', () => {
    const msg = 'Limite atingido. Aguarde 1 minuto e tente novamente.';
    const { fixture } = createComponent(msg);
    const el = fixture.nativeElement.querySelector('.error-message') as HTMLElement;
    expect(el.textContent!.trim()).toBe(msg);
  });

  it('desaparece do DOM quando message muda para null (AC-6/7)', () => {
    const { fixture } = createComponent('Erro inicial');
    expect(fixture.nativeElement.querySelector('.error-message')).toBeTruthy();

    fixture.componentRef.setInput('message', null);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-message')).toBeNull();
  });

  it('reaparece quando message muda de null para string', () => {
    const { fixture } = createComponent(null);
    expect(fixture.nativeElement.querySelector('.error-message')).toBeNull();

    fixture.componentRef.setInput('message', 'Algo deu errado. Tente novamente.');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error-message')).toBeTruthy();
  });
});
