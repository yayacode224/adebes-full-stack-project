import {
  canTransition,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "../../cms/entities/content-status";
import type { GalleryItem } from "../../cms/entities/gallery";
import type { GalleryItemDeps } from "../../cms/ports/gallery.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Fait passer un élément de galerie d'un état à un autre.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA GARDE DE CE LOT PORTE SUR LA PHOTO, PARCE QUE C'EST TOUT CE QU'IL Y A
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les sept collections précédentes publiaient du texte : on pouvait vérifier
 * qu'un titre, une réponse ou un nom n'étaient pas vides. Ici, l'élément ne
 * porte AUCUN texte — `media_id`, `category_id`, `position`, `status`, et rien
 * d'autre (migration 0005).
 *
 * Ce qu'il reste à vérifier tient donc en une ligne, et ce n'est pas
 * décoratif : `media_id` est `not null` en base, mais un `null` transmis par un
 * import ou une écriture directe échouerait sur une contrainte SQL plutôt que
 * sur un message français. Cette barrière est la dernière avant la mise en
 * ligne.
 *
 * ---------------------------------------------------------------------------
 * CE QUI A ÉTÉ ÉCARTÉ, ET POURQUOI
 * ---------------------------------------------------------------------------
 * La tentation était d'exiger une CATÉGORIE avant publication : une photo non
 * classée n'apparaît que dans « Tous ». Elle a été écartée pour trois raisons,
 * dans l'ordre :
 *
 *   1. **L'état n'est pas faux, il est incomplet.** Le Lot 8D refusait de
 *      publier un marqueur `[À COMPLÉTER]` affiché comme un nom : c'était un
 *      gabarit présenté comme un contenu. Une photo sans catégorie est une
 *      vraie photo, correctement affichée, simplement absente d'un filtre.
 *   2. **Ce serait inventer une contrainte que ni la base ni le métier ne
 *      portent** — `category_id` est nullable, et le §8H ne dit rien de tel.
 *      C'est la faute que le Lot 8E a explicitement refusé de commettre
 *      (écart nº 106).
 *   3. **Le geste est trivialement réversible**, contrairement à une
 *      suppression.
 *
 * Ce qui est fait à la place : l'écran le dit — colonne « Catégorie », bandeau
 * de la liste, phrase de la fiche. **Informer plutôt qu'interdire.**
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission — ce n'est pas son rôle. Le
 * contrôle d'accès appartient à `createAction` (§6 du Rapport 1), et la base le
 * double avec le trigger `guard_publish` (ADB01).
 */
export async function setGalleryItemStatus(
  deps: GalleryItemDeps,
  input: { id: string; status: ContentStatus },
): Promise<Result<GalleryItem>> {
  const existant = await deps.read.findById(input.id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Cet élément de galerie n'existe plus."));
  }

  // Rejouer la même transition n'est pas une erreur : deux clics sur
  // « Publier », ou deux onglets ouverts, ne doivent pas produire un message
  // d'échec alors que le résultat voulu est déjà atteint.
  if (existant.status === input.status) {
    return ok(existant);
  }

  if (!canTransition(existant.status, input.status)) {
    return err(
      new AppError(
        "VALIDATION",
        `Un contenu « ${CONTENT_STATUS_LABELS[existant.status]} » ne peut pas passer directement à « ${CONTENT_STATUS_LABELS[input.status]} ».`,
      ),
    );
  }

  if (input.status === "published" && !existant.mediaId) {
    return err(
      new AppError(
        "VALIDATION",
        "Cet élément ne peut pas être publié : aucune photo ne lui est associée.",
      ),
    );
  }

  return ok(await deps.write.setStatus(existant.id, input.status));
}
