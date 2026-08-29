import type { TestimonialDeps } from "../../cms/ports/testimonial.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime un témoignage.
 *
 * Réservée aux administrateurs (`testimonial:delete`), et la base la refuse
 * aussi à un éditeur via la RLS (`testimonials_admin_delete`).
 *
 * ---------------------------------------------------------------------------
 * RIEN NE RÉFÉRENCE UN TÉMOIGNAGE
 * ---------------------------------------------------------------------------
 * C'est lui qui référence : un programme et un média. La suppression n'a donc
 * aucun `on delete restrict` à redouter — c'est la situation INVERSE de celle
 * des programmes, qu'un témoignage empêche de supprimer.
 *
 * Ce qui veut aussi dire qu'un témoignage supprimé libère le programme cité :
 * si c'était le dernier, ce programme redevient supprimable.
 */
export async function deleteTestimonial(
  deps: TestimonialDeps,
  id: string,
): Promise<Result<void>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce témoignage n'existe plus."));
  }

  await deps.write.delete(id);

  /*
    Renumérotation immédiate : sans elle, les positions deviennent 1, 2, 4, 5
    et le prochain `create` — qui calcule `count() + 1` — réutiliserait une
    position déjà occupée.

    ⚠️  Le filtre est EXPLICITE, et ce n'est pas de la décoration :
    `normalizeFilter` ramène une taille de page absente à 20. Un `findAll()`
    nu renverrait donc les 20 premières lignes, et `reorder_rows` renumérotant
    seulement celles-là recréerait exactement les collisions qu'on vient
    d'éviter. La borne haute est `MAX_PAGE_SIZE`.
  */
  const restants = await deps.read.findAll({
    pageSize: MAX_PAGE_SIZE,
    sortBy: "position",
    sortDirection: "asc",
  });
  if (restants.length > 0) {
    await deps.write.reorder(restants.map((t) => t.id));
  }

  return ok(undefined);
}
