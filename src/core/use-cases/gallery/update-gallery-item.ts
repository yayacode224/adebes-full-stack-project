import type { GalleryItem, UpdateGalleryItem } from "../../cms/entities/gallery";
import type { GalleryItemDeps } from "../../cms/ports/gallery.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Modifie un élément de galerie.
 *
 * Ne change PAS le statut : c'est `setGalleryItemStatus` qui s'en charge, parce
 * que la transition obéit à des règles propres et exige une autre permission.
 * Un cas d'usage, une intention (§7 du Rapport 1).
 *
 * L'identifiant est un paramètre distinct de la charge utile : il désigne la
 * cible, il n'en fait pas partie (écart nº 20).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CHANGER LA PHOTO D'UN ÉLÉMENT EN LIGNE EST AUTORISÉ
 * ---------------------------------------------------------------------------
 * La tentation était d'en faire une garde, sur le modèle des Lots 8C et 8D. Elle
 * a été écartée pour la raison qui a valu au Lot 8F (écart nº 121) : **aucun
 * état n'est faux ici**. Remplacer une photo mal cadrée, ou corriger un
 * classement, se fait précisément par cette modification — la refuser
 * empêcherait la correction.
 *
 * La différence avec la citation d'un témoignage (écart nº 82) est réelle : là,
 * réécrire le texte d'un contenu publié faisait dire à une personne réelle
 * quelque chose qu'elle n'avait pas autorisé. Ici, une photo ne prête de propos
 * à personne — et le texte alternatif, qui est ce qu'elle affirme, appartient au
 * média et se corrige dans la médiathèque.
 *
 * ---------------------------------------------------------------------------
 * RETIRER LA CATÉGORIE EST UNE VALEUR, PAS UN OUBLI
 * ---------------------------------------------------------------------------
 * `categoryId: null` est transmis et écrit ; `categoryId: undefined` signifie
 * « champ non modifié ». C'est la distinction que fait le mapper, et elle est
 * le seul moyen d'exprimer « cette photo n'est plus classée ».
 *
 * Conséquence dite à l'écran, jamais interdite : l'élément quitte les boutons
 * de filtre et n'apparaît plus que dans « Tous ».
 */
export async function updateGalleryItem(
  deps: GalleryItemDeps,
  id: string,
  input: UpdateGalleryItem,
): Promise<Result<GalleryItem>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Cet élément de galerie n'existe plus."));
  }

  // Même vérification qu'à la création, et pour la même raison : une catégorie
  // supprimée pendant que le formulaire était ouvert est un cas courant, et le
  // 23503 de la base ne dirait rien d'utile.
  if (input.categoryId) {
    const categorie = await deps.categories.findById(input.categoryId);
    if (!categorie) {
      return err(
        new AppError(
          "VALIDATION",
          "Cette catégorie n'existe plus. Choisissez-en une autre, ou laissez l'élément sans catégorie.",
          { categoryId: "Cette catégorie n'existe plus." },
        ),
      );
    }
  }

  // Le statut est neutralisé plutôt qu'ignoré silencieusement : un formulaire
  // qui renverrait l'entité complète ne doit pas publier par effet de bord.
  // Les repositories ne transmettent pas les champs `undefined`.
  const champs: UpdateGalleryItem = { ...input, status: undefined };

  return ok(await deps.write.update(existant.id, champs));
}
