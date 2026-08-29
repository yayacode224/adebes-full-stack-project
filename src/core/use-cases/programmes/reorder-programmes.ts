import type { ProgrammeDeps } from "../../cms/ports/programme.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Réordonne la liste complète des programmes.
 *
 * Reçoit la liste ENTIÈRE dans le nouvel ordre, pas un déplacement
 * « de l'index 3 vers l'index 1 ». Deux raisons :
 *
 *   * le réordonnancement s'écrit en une seule transaction, sans lecture
 *     intermédiaire ni calcul de décalage ;
 *   * deux personnes qui réordonnent en même temps produisent un résultat
 *     complet et cohérent chacune, au lieu de deux décalages qui se composent
 *     en un ordre que personne n'a voulu.
 */
export async function reorderProgrammes(
  deps: ProgrammeDeps,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) {
    return err(new AppError("VALIDATION", "Aucun élément à réordonner."));
  }

  // Un identifiant en double renumérote deux lignes à la même position et
  // rend l'ordre non déterministe à la lecture suivante.
  if (new Set(orderedIds).size !== orderedIds.length) {
    return err(
      new AppError("VALIDATION", "La liste contient deux fois le même élément."),
    );
  }

  // La liste doit être exhaustive : un programme absent garderait son ancienne
  // position et viendrait s'intercaler n'importe où. C'est le défaut le plus
  // probable si l'interface ne transmet que la page affichée.
  const connus = await deps.read.findAll();
  const idsConnus = new Set(connus.map((p) => p.id));

  const inconnus = orderedIds.filter((id) => !idsConnus.has(id));
  if (inconnus.length > 0) {
    return err(
      new AppError("NOT_FOUND", "Un des programmes à réordonner n'existe plus."),
    );
  }

  if (orderedIds.length !== connus.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste de réordonnancement doit contenir tous les programmes.",
      ),
    );
  }

  await deps.write.reorder(orderedIds);
  return ok(undefined);
}
