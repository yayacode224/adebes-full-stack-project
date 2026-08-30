import type { StatDeps } from "../../cms/ports/stat.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Réordonne la liste complète des chiffres clés.
 *
 * Reçoit la liste ENTIÈRE dans le nouvel ordre, pas un déplacement « de
 * l'index 3 vers l'index 1 ». Deux raisons, identiques aux cinq lots
 * précédents :
 *
 *   * le réordonnancement s'écrit en une seule transaction, sans lecture
 *     intermédiaire ni calcul de décalage ;
 *   * deux personnes qui réordonnent en même temps produisent un résultat
 *     complet et cohérent chacune, au lieu de deux décalages qui se composent
 *     en un ordre que personne n'a voulu.
 *
 * ---------------------------------------------------------------------------
 * L'ORDRE SE VOIT SUR DEUX PAGES À LA FOIS — ET IL EST PLUS VISIBLE QU'AILLEURS
 * ---------------------------------------------------------------------------
 * L'accueil et `/impact` lisent la même liste, dans le même ordre. Aucune des
 * deux ne coupe la liste (contrairement à l'accueil pour les témoignages ou la
 * FAQ) : réordonner ne change donc pas CE QUI est affiché, seulement l'ordre de
 * lecture — mais il le change partout en même temps.
 *
 * ⚠️  Ce que l'ordre décide malgré tout, et qui n'est pas rien : **la grille de
 * l'accueil est en deux colonnes sous 1024 px.** Le premier chiffre de la liste
 * est celui qu'un visiteur au téléphone lit en premier, et les suivants
 * descendent sous la ligne de flottaison. C'est la seule conséquence réelle du
 * réordonnancement sur cette collection, et l'écran de liste la dit.
 *
 * ⚠️  LA LISTE PORTE AUSSI LES CHIFFRES MASQUÉS. Le réordonnancement se fait
 * sur la collection entière, pas sur ce que le site affiche : un chiffre masqué
 * conserve sa place, et la retrouve telle quelle si on le réaffiche.
 */
export async function reorderStats(
  deps: StatDeps,
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

  // La liste doit être exhaustive : un chiffre absent garderait son ancienne
  // position et viendrait s'intercaler n'importe où. C'est le défaut le plus
  // probable si l'interface ne transmet que la page affichée — ou, ici, que les
  // lignes visibles.
  const connus = await deps.read.findAll({ pageSize: MAX_PAGE_SIZE });
  const idsConnus = new Set(connus.map((stat) => stat.id));

  const inconnus = orderedIds.filter((id) => !idsConnus.has(id));
  if (inconnus.length > 0) {
    return err(
      new AppError("NOT_FOUND", "Un des chiffres à réordonner n'existe plus."),
    );
  }

  if (orderedIds.length !== connus.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste de réordonnancement doit contenir tous les chiffres, y compris ceux qui sont masqués.",
      ),
    );
  }

  await deps.write.reorder(orderedIds);
  return ok(undefined);
}
