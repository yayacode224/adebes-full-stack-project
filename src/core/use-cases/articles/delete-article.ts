import type { ArticleDeps } from "../../cms/ports/article.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime un article.
 *
 * La suppression est réservée aux administrateurs (`article:delete`), et la
 * base la refuse aussi à un éditeur via la RLS (`articles_admin_delete`).
 *
 * ---------------------------------------------------------------------------
 * AUCUNE RENUMÉROTATION, CONTRAIREMENT AUX PROGRAMMES
 * ---------------------------------------------------------------------------
 * `deleteProgramme` réordonne les lignes restantes après coup, parce qu'une
 * suppression y laisse un trou dans les positions. La table `articles` n'a pas
 * de colonne `position` : son ordre est celui de `published_at`, qu'une
 * suppression ne perturbe pas. Recopier le geste ici aurait appelé
 * `reorder_rows('articles')`, qui échouerait — voir l'avertissement du dépôt.
 */
export async function deleteArticle(
  deps: ArticleDeps,
  id: string,
): Promise<Result<void>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Cet article n'existe plus."));
  }

  await deps.write.delete(id);
  return ok(undefined);
}
