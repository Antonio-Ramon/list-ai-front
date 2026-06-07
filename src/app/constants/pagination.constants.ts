/** Parâmetros de paginação enviados à API. */
export interface PaginationParams {
  limit: number;
  offset: number;
}

/** Defaults de paginação — 10 itens por página. */
export const PAGINATION: Readonly<PaginationParams> = {
  limit: 10,
  offset: 0,
};
