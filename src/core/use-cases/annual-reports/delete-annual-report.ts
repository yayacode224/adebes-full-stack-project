import type { AnnualReportDeps } from "../../cms/ports/annual-report.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime un rapport annuel.
 *
 * Réservée aux administrateurs (`document:delete`), et la base la refuse aussi
 * à un éditeur via la RLS (`annual_reports_admin_delete`).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE PDF N'EST PAS SUPPRIMÉ
 * ---------------------------------------------------------------------------
 * Même séparation qu'au Lot 8H : supprimer le rapport retire la LIGNE de la
 * section Documents ; le fichier reste dans la médiathèque, disponible pour un
 * autre usage. Le catalogue est la bibliothèque, le rapport n'en est qu'un
 * emploi.
 *
 * La suppression du fichier lui-même passe par `/dashboard/mediatheque`, où
 * l'écran des usages demande confirmation — et où la présence de ce rapport
 * rend d'ailleurs la suppression BLOQUANTE tant qu'il existe (`on delete
 * restrict`, migration 0005). Les deux gestes ne se confondent pas, et la
 * confirmation de l'écran l'écrit.
 *
 * ⚠️  Corollaire moins évident : c'est en supprimant le RAPPORT qu'on débloque
 * la suppression du PDF. L'ordre compte, et l'écran de la médiathèque nomme
 * déjà le rapport bloquant (« Rapport d'activité 2025 (2025) »).
 *
 * Rien d'autre à détacher : `annual_reports` n'est référencée par aucune table.
 */
export async function deleteAnnualReport(
  deps: AnnualReportDeps,
  id: string,
): Promise<Result<void>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce rapport annuel n'existe plus."));
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
  const restants = await deps.read.findAll({
    pageSize: MAX_PAGE_SIZE,
    sortBy: "position",
    sortDirection: "asc",
  });
  if (restants.length > 0) {
    await deps.write.reorder(restants.map((rapport) => rapport.id));
  }

  return ok(undefined);
}
