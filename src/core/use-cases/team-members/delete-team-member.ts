import type { TeamMemberDeps } from "../../cms/ports/team-member.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime un membre de l'équipe.
 *
 * Réservée aux administrateurs (`team:delete`), et la base la refuse aussi à
 * un éditeur via la RLS.
 *
 * ---------------------------------------------------------------------------
 * RIEN NE RÉFÉRENCE UN MEMBRE DE L'ÉQUIPE
 * ---------------------------------------------------------------------------
 * C'est lui qui référence, et une seule chose : un média, en `on delete set
 * null`. La suppression n'a donc aucun `on delete restrict` à redouter — même
 * situation qu'au Lot 8C, et l'inverse du Lot 8A où un témoignage empêche de
 * supprimer un programme.
 *
 * ⚠️  La PHOTO n'est pas supprimée. Elle appartient à la médiathèque, où elle
 * peut servir ailleurs ; c'est `media_assets` qui décide de son sort, pas
 * cette collection. Supprimer le fichier ici casserait silencieusement une
 * autre page.
 */
export async function deleteTeamMember(
  deps: TeamMemberDeps,
  id: string,
): Promise<Result<void>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce membre de l'équipe n'existe plus."));
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
    d'éviter. La borne haute est `MAX_PAGE_SIZE`. Défaut trouvé au Lot 8C.
  */
  const restants = await deps.read.findAll({
    pageSize: MAX_PAGE_SIZE,
    sortBy: "position",
    sortDirection: "asc",
  });
  if (restants.length > 0) {
    await deps.write.reorder(restants.map((membre) => membre.id));
  }

  return ok(undefined);
}
