import type { GalleryItemDeps } from "../../cms/ports/gallery.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Retire une photo de la galerie.
 *
 * Réservée aux administrateurs (`gallery:delete`), et la base la refuse aussi à
 * un éditeur via la RLS (`gallery_items_admin_delete`).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE FICHIER N'EST PAS SUPPRIMÉ, ET C'EST LE POINT À COMPRENDRE
 * ---------------------------------------------------------------------------
 * Supprimer un élément de galerie retire la photo de la GRILLE ; le média reste
 * dans la médiathèque, disponible pour un autre usage. C'est le sens même de la
 * séparation posée au Lot 7 : le catalogue est la bibliothèque, la galerie n'en
 * est qu'un emploi.
 *
 * La suppression du fichier lui-même passe par `/dashboard/mediatheque`, où
 * l'écran des usages demande confirmation — et où la présence de cet élément
 * rend d'ailleurs la suppression BLOQUANTE tant qu'il existe (`on delete
 * restrict`). Les deux gestes ne se confondent pas, et la confirmation de cet
 * écran l'écrit.
 *
 * Rien d'autre à détacher : `gallery_items` n'est référencée par aucune table.
 */
export async function deleteGalleryItem(
  deps: GalleryItemDeps,
  id: string,
): Promise<Result<void>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Cet élément de galerie n'existe plus."));
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
    await deps.write.reorder(restants.map((element) => element.id));
  }

  return ok(undefined);
}
