import type { GalleryItemDeps } from "../../cms/ports/gallery.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Réordonne la grille de la galerie.
 *
 * Reçoit la liste ENTIÈRE dans le nouvel ordre, pas un déplacement « de
 * l'index 3 vers l'index 1 ». Deux raisons, identiques aux Lots 8A à 8G :
 *
 *   * le réordonnancement s'écrit en une seule transaction, sans lecture
 *     intermédiaire ni calcul de décalage ;
 *   * deux personnes qui réordonnent en même temps produisent un résultat
 *     complet et cohérent chacune, au lieu de deux décalages qui se composent
 *     en un ordre que personne n'a voulu.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'ORDRE EST GLOBAL, ET IL SE VOIT DANS CHAQUE FILTRE
 * ---------------------------------------------------------------------------
 * `reorder_rows` renumérote la table ENTIÈRE de 1 à N, toutes catégories
 * confondues — comme au Lot 8F pour les sujets de la FAQ. Une photo
 * d'environnement déplacée en tête décale donc les positions des photos
 * d'éducation, alors qu'elles ne partagent aucun bouton de filtre.
 *
 * Sans conséquence sur ce que le visiteur VOIT : la grille filtrée conserve
 * l'ordre relatif de sa catégorie, et c'est le seul qui compte à l'intérieur
 * d'un filtre. La différence avec le Lot 8F tient là — l'accueil n'affichait que
 * les quatre premières questions, donc l'ordre décidait de ce qui était visible
 * (écart nº 120). Ici, **rien n'est coupé** : toutes les photos publiées sont
 * rendues, dans tous les cas. Réordonner ne peut donc pas faire disparaître un
 * contenu.
 */
export async function reorderGalleryItems(
  deps: GalleryItemDeps,
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

  // La liste doit être exhaustive : un élément absent garderait son ancienne
  // position et viendrait s'intercaler n'importe où. C'est le défaut le plus
  // probable si l'interface ne transmet que la page affichée.
  const connus = await deps.read.findAll({ pageSize: MAX_PAGE_SIZE });
  const idsConnus = new Set(connus.map((element) => element.id));

  const inconnus = orderedIds.filter((id) => !idsConnus.has(id));
  if (inconnus.length > 0) {
    return err(
      new AppError("NOT_FOUND", "Un des éléments à réordonner n'existe plus."),
    );
  }

  if (orderedIds.length !== connus.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste de réordonnancement doit contenir tous les éléments.",
      ),
    );
  }

  await deps.write.reorder(orderedIds);
  return ok(undefined);
}
