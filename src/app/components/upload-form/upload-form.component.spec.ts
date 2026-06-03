import { ComponentFixture, TestBed } from '@angular/core/testing';
import { UploadFormComponent } from './upload-form.component';

describe('UploadFormComponent', () => {
  function createComponent(isLoading = false) {
    const fixture = TestBed.createComponent(UploadFormComponent);
    fixture.componentRef.setInput('isLoading', isLoading);
    fixture.detectChanges();
    return { fixture, component: fixture.componentInstance };
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [UploadFormComponent],
    }).compileComponents();
  });

  it('should create', () => {
    const { component } = createComponent();
    expect(component).toBeTruthy();
  });

  it('upload-zone é label com for="file-input"', () => {
    const { fixture } = createComponent();
    const label = fixture.nativeElement.querySelector('label.upload-zone');
    expect(label).toBeTruthy();
    expect(label.getAttribute('for')).toBe('file-input');
  });

  it('input[type=file] oculto com accept correto', () => {
    const { fixture } = createComponent();
    const input = fixture.nativeElement.querySelector('input[type="file"]') as HTMLInputElement;
    expect(input).toBeTruthy();
    expect(input.getAttribute('accept')).toBe('image/jpeg,image/png,image/webp');
  });

  it('botão desabilitado sem arquivo selecionado', () => {
    const { fixture } = createComponent();
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(true);
  });

  it('file-row não exibido no estado inicial', () => {
    const { fixture } = createComponent();
    expect(fixture.nativeElement.querySelector('.file-row')).toBeNull();
  });

  it('onFileChange emite fileSelected e exibe file-row', () => {
    const { fixture, component } = createComponent();
    const emittedFiles: File[] = [];
    component.fileSelected.subscribe((f) => emittedFiles.push(f));

    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });
    component.onFileChange({ target: { files: { 0: file } } } as unknown as Event);
    fixture.detectChanges();

    expect(emittedFiles).toHaveLength(1);
    expect(emittedFiles[0]).toBe(file);
    expect(component.selectedFile()).toBe(file);
    expect(fixture.nativeElement.querySelector('.file-row')).toBeTruthy();
  });

  it('file-row exibe nome e tamanho do arquivo', () => {
    const { fixture, component } = createComponent();
    const file = { name: 'nota.jpg', size: 2_457_600, type: 'image/jpeg' } as File;

    component.onFileChange({ target: { files: { 0: file } } } as unknown as Event);
    fixture.detectChanges();

    const name = fixture.nativeElement.querySelector('.file-row__name') as HTMLElement;
    const size = fixture.nativeElement.querySelector('.file-row__size') as HTMLElement;
    expect(name.textContent!.trim()).toBe('nota.jpg');
    expect(size.textContent!.trim()).toContain('MB');
  });

  it('botão habilitado após seleção de arquivo', () => {
    const { fixture, component } = createComponent();
    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });

    component.onFileChange({ target: { files: { 0: file } } } as unknown as Event);
    fixture.detectChanges();

    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    expect(btn.disabled).toBe(false);
  });

  it('onSubmit com arquivo ≤ 10 MB emite submitted e sem erro', () => {
    const { component } = createComponent();
    const submittedCalls: unknown[] = [];
    component.submitted.subscribe(() => submittedCalls.push(null));

    const file = new File(['data'], 'nota.jpg', { type: 'image/jpeg' });
    component.onFileChange({ target: { files: { 0: file } } } as unknown as Event);
    component.onSubmit();

    expect(submittedCalls).toHaveLength(1);
    expect(component.fileSizeError()).toBeNull();
  });

  it('onSubmit com arquivo > 10 MB: fileSizeError preenchido, submitted não emitido', () => {
    const { fixture, component } = createComponent();
    const submittedCalls: unknown[] = [];
    component.submitted.subscribe(() => submittedCalls.push(null));

    const largeFile = { name: 'grande.jpg', size: 11 * 1024 * 1024, type: 'image/jpeg' } as File;
    component.onFileChange({ target: { files: { 0: largeFile } } } as unknown as Event);
    component.onSubmit();
    fixture.detectChanges();

    expect(submittedCalls).toHaveLength(0);
    expect(component.fileSizeError()).toBe('Arquivo muito grande. Máximo 10 MB.');
    expect(fixture.nativeElement.querySelector('[role="alert"]')).toBeTruthy();
  });

  it('isLoading=true: botão desabilitado e upload-zone com classe --loading', () => {
    const { fixture } = createComponent(true);
    const btn = fixture.nativeElement.querySelector('button') as HTMLButtonElement;
    const zone = fixture.nativeElement.querySelector('.upload-zone') as HTMLElement;

    expect(btn.disabled).toBe(true);
    expect(zone.classList).toContain('upload-zone--loading');
  });

  it('onFileChange limpa fileSizeError do arquivo anterior', () => {
    const { component } = createComponent();
    component['fileSizeError'].set('erro anterior');

    const file = new File(['data'], 'novo.jpg', { type: 'image/jpeg' });
    component.onFileChange({ target: { files: { 0: file } } } as unknown as Event);

    expect(component.fileSizeError()).toBeNull();
  });

  it('onSubmit sem arquivo não emite nada', () => {
    const { component } = createComponent();
    const submittedCalls: unknown[] = [];
    component.submitted.subscribe(() => submittedCalls.push(null));

    component.onSubmit();

    expect(submittedCalls).toHaveLength(0);
    expect(component.fileSizeError()).toBeNull();
  });

  it('formatFileSize formata KB e MB corretamente', () => {
    const { component } = createComponent();
    expect(component.formatFileSize(512 * 1024)).toBe('512.0 KB');
    expect(component.formatFileSize(2.4 * 1024 * 1024)).toContain('MB');
  });
});
