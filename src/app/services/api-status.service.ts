import { computed, Injectable, signal } from '@angular/core';

export type ApiStatus = 'checking' | 'online' | 'offline';

interface StatusView {
  label: string;
  hint: string;
}

const STATUS_VIEW: Record<ApiStatus, StatusView> = {
  checking: {
    label: 'Verificando API…',
    hint: 'Conferindo a conexão com o servidor.',
  },
  online: {
    label: 'API conectada',
    hint: 'Fotos nítidas e bem iluminadas extraem melhor.',
  },
  offline: {
    label: 'API desconectada',
    hint: 'Sem resposta do servidor. Novas extrações vão falhar até a conexão voltar.',
  },
};

/**
 * Status de conectividade com a API.
 *
 * Não existe endpoint de health no backend, então o status é derivado das
 * requisições reais: histórico, extração e exclusão reportam o resultado aqui.
 * Só falhas de conexão (rede, timeout, host fora do ar) marcam `offline`;
 * erros de negócio (4xx com `code`) provam que o servidor está de pé.
 */
@Injectable({ providedIn: 'root' })
export class ApiStatusService {
  private readonly state = signal<ApiStatus>('checking');

  readonly status = this.state.asReadonly();
  readonly isOffline = computed(() => this.state() === 'offline');
  readonly isChecking = computed(() => this.state() === 'checking');
  readonly label = computed(() => STATUS_VIEW[this.state()].label);
  readonly hint = computed(() => STATUS_VIEW[this.state()].hint);

  /** Resposta recebida do servidor — a API está de pé. */
  reportOnline(): void {
    this.state.set('online');
  }

  /** Servidor inalcançável. */
  reportOffline(): void {
    this.state.set('offline');
  }

  /** Volta para "verificando" enquanto uma nova tentativa está em andamento. */
  reportChecking(): void {
    this.state.set('checking');
  }

  /** Atalho: `connectionFailed` vem de `isConnectionError`. */
  report(connectionFailed: boolean): void {
    if (connectionFailed) this.reportOffline();
    else this.reportOnline();
  }
}
