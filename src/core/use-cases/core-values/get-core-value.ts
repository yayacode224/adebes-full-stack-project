import type { CoreValue } from "../../cms/entities/core-value";
import type { CoreValueReadPort } from "../../cms/ports/core-value.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Récupère une valeur par son identifiant — écran d'édition du dashboard.
 *
 * Il n'existe pas de `getCoreValueBySlug` : une valeur n'a pas d'adresse
 * publique. C'est la troisième collection du Lot 8 dans ce cas, après les
 * témoignages et l'équipe — et la seule dont la fiche n'offre pas non plus de
 * bouton « Voir sur le site » unique, puisqu'elle apparaît sur DEUX pages.
 */
export async function getCoreValueById(
  read: CoreValueReadPort,
  id: string,
): Promise<Result<CoreValue>> {
  const valeur = await read.findById(id);
  if (!valeur) {
    return err(new AppError("NOT_FOUND", "Cette valeur n'existe plus."));
  }
  return ok(valeur);
}
