import type { CoreValueDeps } from "../../cms/ports/core-value.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Réordonne la liste complète des valeurs.
 *
 * Reçoit la liste ENTIÈRE dans le nouvel ordre, pas un déplacement « de
 * l'index 3 vers l'index 1 ». Deux raisons, identiques aux quatre lots
 * précédents :
 *
 *   * le réordonnancement s'écrit en une seule transaction, sans lecture
 *     intermédiaire ni calcul de décalage ;
 *   * deux personnes qui réordonnent en même temps produisent un résultat
 *     complet et cohérent chacune, au lieu de deux décalages qui se composent
 *     en un ordre que personne n'a voulu.
 *
 * ---------------------------------------------------------------------------
 * L'ORDRE SE VOIT SUR DEUX PAGES À LA FOIS
 * ---------------------------------------------------------------------------
 * C'est la particularité de cette collection : la grille de l'accueil et celle
 * de « Qui sommes-nous » lisent la même liste, dans le même ordre. Il n'y a pas
 * de coupe à trois comme sur l'accueil pour les témoignages — réordonner ne
 * change donc pas ce qui est visible, seulement l'ordre de lecture, mais il le
 * change partout en même temps.
 *
 * ⚠️  LA LISTE PORTE AUSSI LES VALEURS MASQUÉES. Le réordonnancement se fait
 * sur la collection entière, pas sur ce que le site affiche : une valeur
 * masquée conserve sa place, et la retrouve telle quelle si on la réaffiche.
 * L'inverse — renuméroter les seules visibles — ferait remonter une valeur
 * masquée en tête de liste le jour de son retour.
 */
export async function reorderCoreValues(
  deps: CoreValueDeps,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) {
    return err(new AppError("VALIDATION", "Aucun élément à réordonner."));
  }

  // Un identifiant en double renumérote deux lignes à la même position et rend
  // l'ordre non déterministe à la lecture suivante.
  if (new Set(orderedIds).size !== orderedIds.length) {
    return err(
      new AppError("VALIDATION", "La liste contient deux fois le même élément."),
    );
  }

  // La liste doit être exhaustive : une valeur absente garderait son ancienne
  // position et viendrait s'intercaler n'importe où. C'est le défaut le plus
  // probable si l'interface ne transmet que la page affichée — ou, ici, que les
  // lignes visibles.
  const connues = await deps.read.findAll({ pageSize: MAX_PAGE_SIZE });
  const idsConnus = new Set(connues.map((valeur) => valeur.id));

  const inconnus = orderedIds.filter((id) => !idsConnus.has(id));
  if (inconnus.length > 0) {
    return err(
      new AppError("NOT_FOUND", "Une des valeurs à réordonner n'existe plus."),
    );
  }

  if (orderedIds.length !== connues.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste de réordonnancement doit contenir toutes les valeurs, y compris celles qui sont masquées.",
      ),
    );
  }

  await deps.write.reorder(orderedIds);
  return ok(undefined);
}
