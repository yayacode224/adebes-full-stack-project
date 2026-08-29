/**
 * Pagination, tri et filtrage — vocabulaire commun à toutes les listes.
 *
 * Les valeurs sont bornées ici plutôt que dans chaque repository : une taille
 * de page arrivant d'une requête HTTP ne doit jamais pouvoir demander dix mille
 * lignes, et l'oubli d'une borne dans un seul repository suffirait.
 */

export const DEFAULT_PAGE_SIZE = 20;
export const MAX_PAGE_SIZE = 100;

export type SortDirection = "asc" | "desc";

export type ListFilter = {
  /** Page demandée, à partir de 1. */
  page?: number;
  pageSize?: number;
  /** Recherche plein texte simple, appliquée aux colonnes déclarées par le repository. */
  search?: string;
  /** Filtre par statut éditorial. `undefined` = tous les statuts. */
  status?: string;
  /** Colonne de tri. Le repository valide qu'elle lui appartient. */
  sortBy?: string;
  sortDirection?: SortDirection;
};

export type Page<T> = {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
};

/** Ramène une valeur douteuse à un entier dans les bornes. */
function borne(valeur: number | undefined, defaut: number, min: number, max: number): number {
  if (typeof valeur !== "number" || !Number.isFinite(valeur)) return defaut;
  return Math.min(max, Math.max(min, Math.trunc(valeur)));
}

export function normalizeFilter(filter: ListFilter = {}): Required<
  Pick<ListFilter, "page" | "pageSize">
> &
  ListFilter {
  return {
    ...filter,
    page: borne(filter.page, 1, 1, Number.MAX_SAFE_INTEGER),
    pageSize: borne(filter.pageSize, DEFAULT_PAGE_SIZE, 1, MAX_PAGE_SIZE),
    search: filter.search?.trim() || undefined,
  };
}

/**
 * Bornes `range()` de PostgREST, qui sont inclusives des deux côtés.
 *
 * Page 1 avec 20 par page → [0, 19]. L'erreur classique est d'y mettre 20,
 * ce qui renvoie 21 lignes et décale toutes les pages suivantes.
 */
export function toRange(filter: ListFilter = {}): { from: number; to: number } {
  const { page, pageSize } = normalizeFilter(filter);
  const from = (page - 1) * pageSize;
  return { from, to: from + pageSize - 1 };
}

export function toPage<T>(items: T[], total: number, filter: ListFilter = {}): Page<T> {
  const { page, pageSize } = normalizeFilter(filter);
  return {
    items,
    total,
    page,
    pageSize,
    pageCount: Math.max(1, Math.ceil(total / pageSize)),
  };
}
