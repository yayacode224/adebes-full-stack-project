import type { MediaAsset } from "../../cms/entities/media-asset";
import type { MediaReadPort } from "../../cms/ports/media.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/** Un média par son identifiant. L'absence est une erreur métier, pas une panne. */
export async function getMedia(
  read: MediaReadPort,
  id: string,
): Promise<Result<MediaAsset>> {
  const media = await read.findById(id);

  if (!media) {
    return err(new AppError("NOT_FOUND", "Ce média n'existe plus."));
  }

  return ok(media);
}

/**
 * Plusieurs médias d'un coup.
 *
 * Sert aux écrans qui affichent une vignette par ligne : sans lecture groupée,
 * une liste de vingt programmes déclencherait vingt requêtes.
 *
 * ⚠️  Le résultat peut être PLUS COURT que la demande — un identifiant qui ne
 * correspond plus à rien n'y figure pas. C'est volontaire, et c'est la forme
 * qui rend l'invariant nº 2 tenable : l'appelant constate l'absence et affiche
 * un `MediaPlaceholder`, au lieu de rendre une image cassée.
 */
export async function getMediaByIds(
  read: MediaReadPort,
  ids: string[],
): Promise<Result<MediaAsset[]>> {
  const uniques = [...new Set(ids.filter(Boolean))];
  if (uniques.length === 0) return ok([]);

  return ok(await read.findByIds(uniques));
}
