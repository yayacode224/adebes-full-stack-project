import type { MediaAsset, MediaUsage } from "../../cms/entities/media-asset";
import type { MediaDeps, MediaReadPort } from "../../cms/ports/media.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Les usages d'un média, tels que l'écran de suppression les affiche.
 *
 * §7 du Rapport 2 : « Supprimer un média utilisé affiche la liste des usages
 * et demande confirmation. » C'est une lecture, elle vit donc à part du cas
 * d'usage de suppression — le dashboard la demande AVANT d'ouvrir la
 * confirmation, pas après avoir cliqué.
 */
export async function listMediaUsages(
  read: MediaReadPort,
  id: string,
): Promise<Result<MediaUsage[]>> {
  return ok(await read.findUsages(id));
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SUPPRIMER UN MÉDIA
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * LA RÈGLE MÉTIER : CERTAINS USAGES INTERDISENT LA SUPPRESSION
 * ---------------------------------------------------------------------------
 * Deux familles d'usages, et la différence vient de la base :
 *
 *   * `on delete set null` — couverture d'un programme, photo d'un membre,
 *     image Open Graph d'une page… La suppression vide proprement la référence
 *     et l'élément retombe sur son `MediaPlaceholder`. C'est le comportement
 *     actuel du site, préservé.
 *
 *   * `on delete restrict` — `gallery_items.media_id` et
 *     `annual_reports.document_media_id`. PostgreSQL refuserait, et il aurait
 *     raison : un élément de galerie sans image n'est plus rien.
 *     S'y ajoute `programmes.gallery_media_ids`, qui est un `uuid[]` SANS clé
 *     étrangère : la base laisserait passer et le tableau garderait un
 *     identifiant mort — l'invariant nº 2 du projet (« aucun lien mort »)
 *     l'interdit, donc c'est bloqué ici.
 *
 * Refuser AVANT d'appeler la base, plutôt que de traduire un 23503 après coup,
 * permet de dire OÙ retirer le média — ce qu'un code d'erreur SQL ne sait pas.
 *
 * ---------------------------------------------------------------------------
 * L'ORDRE : LE CATALOGUE D'ABORD, LE FICHIER ENSUITE
 * ---------------------------------------------------------------------------
 * L'inverse du téléversement, et pour la même raison — on choisit la panne la
 * moins nocive :
 *
 *   * fichier puis catalogue → si la ligne résiste (RLS, clé étrangère
 *     oubliée), le catalogue référence un objet supprimé : image cassée sur le
 *     site public ;
 *   * catalogue puis fichier → si l'objet résiste, il devient orphelin :
 *     invisible, sans effet, et journalisé.
 *
 * Un échec de la suppression du fichier ne fait donc PAS échouer l'action : la
 * ligne est déjà supprimée, renvoyer une erreur ferait croire à l'utilisateur
 * que le média est toujours là — il rechargerait, ne le verrait plus, et
 * conclurait que le dashboard ment.
 */
export async function deleteMedia(
  deps: MediaDeps,
  id: string,
): Promise<Result<{ id: string; usages: MediaUsage[] }>> {
  const media: MediaAsset | null = await deps.read.findById(id);

  if (!media) {
    return err(new AppError("NOT_FOUND", "Ce média n'existe plus."));
  }

  const usages = await deps.read.findUsages(id);
  const bloquants = usages.filter((usage) => usage.blocking);

  if (bloquants.length > 0) {
    return err(
      new AppError(
        "CONFLICT",
        `Ce fichier ne peut pas être supprimé : il est ${bloquants.length > 1 ? "utilisé aux endroits suivants" : "utilisé ici"} — ${bloquants
          .map((usage) => `${usage.resource} « ${usage.label} »`)
          .join(", ")}. Retirez-le d'abord de ${bloquants.length > 1 ? "ces éléments" : "cet élément"}.`,
      ),
    );
  }

  await deps.write.delete(id);

  try {
    await deps.storage.remove(media.bucket, [media.path]);
  } catch (erreur) {
    console.error("[ADEBES] Fichier orphelin après suppression du catalogue", {
      bucket: media.bucket,
      path: media.path,
      erreur,
    });
  }

  // Les usages non bloquants sont renvoyés : l'interface annonce alors
  // combien d'éléments viennent de perdre leur illustration, plutôt que de
  // laisser l'utilisateur le découvrir sur le site public.
  return ok({ id, usages });
}
