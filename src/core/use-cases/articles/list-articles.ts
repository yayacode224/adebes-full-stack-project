import type { Article } from "../../cms/entities/article";
import type { ArticleReadPort } from "../../cms/ports/article.port";
import { ok, type Result } from "../../shared/result";
import {
  normalizeFilter,
  toPage,
  type ListFilter,
  type Page,
} from "../../shared/pagination";

/**
 * Liste paginée des articles, pour le dashboard.
 *
 * ⚠️  Ne reçoit qu'un `ArticleReadPort` — pas les deux. Une lecture ne peut
 * structurellement pas écrire (§7 du Rapport 1, principe I).
 *
 * Le tri par défaut est `published_at desc` et non `position` : un fil
 * d'actualités s'ordonne par sa date. Le dashboard montre donc le plus récent
 * en premier, comme le site.
 */
export async function listArticles(
  read: ArticleReadPort,
  filter: ListFilter = {},
): Promise<Result<Page<Article>>> {
  const normalise = normalizeFilter({
    sortBy: "publishedAt",
    sortDirection: "desc",
    ...filter,
  });

  const [items, total] = await Promise.all([
    read.findAll(normalise),
    read.count(normalise),
  ]);

  return ok(toPage(items, total, normalise));
}

/**
 * Articles publiés et dont la date est échue — ce que voit le site public.
 *
 * La condition `published_at <= now()` est portée par le PORT
 * (`findPublished`) plutôt que par un filtre passé ici : c'est une règle de
 * publication, pas une préférence d'affichage. Un appelant ne doit pas pouvoir
 * l'oublier.
 */
export async function listPublishedArticles(
  read: ArticleReadPort,
  limit?: number,
): Promise<Result<Article[]>> {
  return ok(await read.findPublished(limit));
}
