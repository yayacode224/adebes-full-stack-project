import type { AnnualReportDeps } from "../../cms/ports/annual-report.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Réordonne la liste des rapports annuels.
 *
 * Reçoit la liste ENTIÈRE dans le nouvel ordre, pas un déplacement « de
 * l'index 3 vers l'index 1 ». Deux raisons, identiques aux Lots 8A à 8H :
 *
 *   * le réordonnancement s'écrit en une seule transaction, sans lecture
 *     intermédiaire ni calcul de décalage ;
 *   * deux personnes qui réordonnent en même temps produisent un résultat
 *     complet et cohérent chacune, au lieu de deux décalages qui se composent
 *     en un ordre que personne n'a voulu.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  C'EST LA SEULE COLLECTION OÙ L'ORDRE PEUT CONTREDIRE UNE DONNÉE
 * ---------------------------------------------------------------------------
 * `annual_reports` porte à la fois une `position` et une `year`. Les huit
 * autres collections n'ont rien qui suggère un ordre « naturel » : un programme
 * ou une valeur se rangent comme on veut. Un rapport 2024 placé avant un
 * rapport 2026, en revanche, se lit comme une erreur.
 *
 * Ce cas d'usage ne l'interdit PAS, et ne réordonne rien tout seul :
 *
 *   * l'ordre reste une décision éditoriale — mettre en tête le rapport que
 *     l'association veut faire lire est légitime ;
 *   * réordonner d'office écrirait des positions que personne n'a demandées,
 *     et ferait sauter le rapport qu'on vient de glisser.
 *
 * C'est l'écran de liste qui compare les deux ordres (`ordreSuitLesAnnees`, dans
 * l'entité) et le DIT. Informer plutôt qu'interdire — doctrine des Lots 8E
 * à 8H.
 *
 * ---------------------------------------------------------------------------
 * RÉORDONNER NE PEUT PAS FAIRE DISPARAÎTRE UN CONTENU
 * ---------------------------------------------------------------------------
 * Comme au Lot 8H, et contrairement au Lot 8F (écart nº 120) : la section
 * Documents de `/impact` affiche TOUS les rapports publiés, sans coupe. Un
 * éditeur — qui a `document:reorder` mais pas `document:publish` — ne peut donc
 * pas retirer un rapport du site en le repoussant en fin de liste. Vérifié dans
 * la page publique, pas supposé.
 */
export async function reorderAnnualReports(
  deps: AnnualReportDeps,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) {
    return err(new AppError("VALIDATION", "Aucun rapport à réordonner."));
  }

  // Un identifiant en double renumérote deux lignes à la même position et rend
  // l'ordre non déterministe à la lecture suivante.
  if (new Set(orderedIds).size !== orderedIds.length) {
    return err(
      new AppError("VALIDATION", "La liste contient deux fois le même rapport."),
    );
  }

  // La liste doit être exhaustive : un rapport absent garderait son ancienne
  // position et viendrait s'intercaler n'importe où. C'est le défaut le plus
  // probable si l'interface ne transmet que la page affichée.
  const connus = await deps.read.findAll({ pageSize: MAX_PAGE_SIZE });
  const idsConnus = new Set(connus.map((rapport) => rapport.id));

  const inconnus = orderedIds.filter((id) => !idsConnus.has(id));
  if (inconnus.length > 0) {
    return err(
      new AppError("NOT_FOUND", "Un des rapports à réordonner n'existe plus."),
    );
  }

  if (orderedIds.length !== connus.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste de réordonnancement doit contenir tous les rapports.",
      ),
    );
  }

  await deps.write.reorder(orderedIds);
  return ok(undefined);
}
