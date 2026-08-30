import type { GalleryItem } from "../../cms/entities/gallery";
import type { GalleryItemReadPort } from "../../cms/ports/gallery.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Récupère un élément de galerie par son identifiant — écran d'édition.
 *
 * Il n'existe pas de `getGalleryItemBySlug` : une photo de galerie n'a pas
 * d'adresse publique. C'est la cinquième collection du Lot 8 dans ce cas, après
 * les témoignages, l'équipe, les valeurs et la FAQ.
 *
 * ⚠️  Cet élément ne porte AUCUN texte : ni titre, ni légende. Ce que l'écran
 * affichera pour le désigner — le texte alternatif — appartient au média, et
 * c'est la page qui le résout (`getMediaByIds`). Le domaine ne connaît qu'un
 * `mediaId`.
 */
export async function getGalleryItemById(
  read: GalleryItemReadPort,
  id: string,
): Promise<Result<GalleryItem>> {
  const element = await read.findById(id);
  if (!element) {
    return err(new AppError("NOT_FOUND", "Cet élément de galerie n'existe plus."));
  }
  return ok(element);
}
