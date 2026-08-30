import type { FaqItemDeps } from "../../cms/ports/faq-item.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime une question fréquente.
 *
 * Réservée aux administrateurs (`faq:delete`), et la base la refuse aussi à un
 * éditeur via la RLS (`faq_items_admin_delete`).
 *
 * ---------------------------------------------------------------------------
 * RIEN NE RÉFÉRENCE UNE QUESTION, ET ELLE NE RÉFÉRENCE RIEN
 * ---------------------------------------------------------------------------
 * La suppression n'a donc aucun `on delete restrict` à redouter, et aucun
 * fichier à détacher — pas même une photo, contrairement aux Lots 8C et 8D.
 * C'est la suppression la plus simple du Lot 8.
 */
export async function deleteFaqItem(
  deps: FaqItemDeps,
  id: string,
): Promise<Result<void>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette question n'existe plus."));
  }

  await deps.write.delete(id);

  /*
    Renumérotation immédiate : sans elle, les positions deviennent 1, 2, 4, 5
    et le prochain `create` — qui calcule `count() + 1` — réutiliserait une
    position déjà occupée.

    ⚠️  Le filtre est EXPLICITE, et ce n'est pas de la décoration :
    `normalizeFilter` ramène une taille de page absente à 20. Un `findAll()` nu
    renverrait donc les 20 premières lignes, et `reorder_rows` renumérotant
    seulement celles-là recréerait exactement les collisions qu'on vient
    d'éviter. La borne haute est `MAX_PAGE_SIZE`. Défaut trouvé au Lot 8C.
  */
  const restantes = await deps.read.findAll({
    pageSize: MAX_PAGE_SIZE,
    sortBy: "position",
    sortDirection: "asc",
  });
  if (restantes.length > 0) {
    await deps.write.reorder(restantes.map((question) => question.id));
  }

  return ok(undefined);
}
