import { computed, inject, Injectable, signal } from '@angular/core';
import { httpResource } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { PAGINATION } from '../constants/pagination.constants';
import { HistoryEntry, HistoryResult } from '../types/extraction.types';
import { HttpParamsService } from './http-params.service';

/**
 * Cache reativo do histórico.
 *
 * Provido em root: o `httpResource` vive no singleton, então sair e voltar
 * à tela de histórico não dispara nova requisição (o request signal não muda).
 * A paginação usa um `limit` crescente (offset 0), mantendo a lista acumulada
 * num único request cacheável. Exclusões são refletidas localmente.
 */
@Injectable({ providedIn: 'root' })
export class HistoryStore {
  private readonly paramsBuilder = inject(HttpParamsService);
  private readonly pageSize = PAGINATION.limit;

  private readonly limit = signal(this.pageSize);
  private readonly deletedIds = signal<ReadonlySet<string>>(new Set());

  private readonly resource = httpResource<HistoryResult>(() => ({
    url: `${environment.apiUrl}/history`,
    params: this.paramsBuilder.build({ limit: this.limit(), offset: PAGINATION.offset }),
  }));

  /** Extrações carregadas (sem as excluídas localmente). */
  readonly entries = computed<HistoryEntry[]>(() => {
    const deleted = this.deletedIds();
    return (this.resource.value()?.history ?? []).filter((e) => !deleted.has(e.id));
  });

  /** Total no servidor, descontando exclusões locais. */
  readonly total = computed(() => Math.max(0, (this.resource.value()?.total ?? 0) - this.deletedIds().size));

  readonly hasMore = computed(() => this.entries().length < this.total());

  /** Carregamento inicial (ainda não há dados em cache). */
  readonly loading = computed(() => this.resource.isLoading() && !this.resource.hasValue());

  /** Carregando uma página adicional. */
  readonly loadingMore = computed(() => this.resource.isLoading() && this.resource.hasValue());

  readonly hasError = computed(() => this.resource.error() != null);

  loadMore(): void {
    if (this.hasMore() && !this.resource.isLoading()) {
      this.limit.update((l) => l + this.pageSize);
    }
  }

  /** Marca uma extração como excluída sem refazer a busca. */
  markDeleted(id: string): void {
    this.deletedIds.update((set) => new Set(set).add(id));
  }

  /** Invalida o cache e força nova busca (ex.: após uma nova extração). */
  refresh(): void {
    this.deletedIds.set(new Set());
    this.limit.set(this.pageSize);
    this.resource.reload();
  }
}
