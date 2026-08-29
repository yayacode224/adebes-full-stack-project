import type { MediaAsset } from "../../cms/entities/media-asset";
import type { MediaDeps } from "../../cms/ports/media.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * Corriger la fiche d'un média : texte alternatif, légende, dossier.
 *
 * ⚠️  Le FICHIER n'est pas touché. `path`, `bucket`, `mimeType` et `sizeBytes`
 * décrivent un objet déjà écrit dans le bucket ; les rendre modifiables
 * permettrait au catalogue de mentir sur le contenu réel du stockage, et la
 * contrainte `unique` sur `path` (migration 0004) existe précisément pour
 * qu'aucune ligne ne puisse en contredire une autre.
 *
 * Conséquence assumée : renommer le dossier d'un média change son rangement
 * dans le dashboard, PAS son chemin de stockage. Déplacer réellement l'objet
 * supposerait de le recopier puis de supprimer l'ancien, avec une fenêtre
 * pendant laquelle l'URL publique change — donc un lien mort si une page était
 * en cache. Le rangement est une commodité d'organisation, pas une adresse.
 */
export type UpdateMediaCommand = {
  id: string;
  altText: string;
  caption: string | null;
  folder: string | null;
};

export async function updateMedia(
  deps: MediaDeps,
  input: UpdateMediaCommand,
): Promise<Result<MediaAsset>> {
  const existant = await deps.read.findById(input.id);

  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce média n'existe plus."));
  }

  /*
   * Deuxième barrage sur le texte alternatif.
   *
   * Le schéma Zod le garantit déjà, et la base l'exige (`not null`). C'est
   * malgré tout revérifié ici : la règle « aucune image sans description » est
   * une règle du DOMAINE, et un cas d'usage ne doit pas dépendre du fait qu'un
   * appelant ait bien choisi le bon schéma.
   */
  const altText = input.altText.trim();

  if (!altText) {
    return err(
      new AppError(
        "VALIDATION",
        "Le texte alternatif est obligatoire : il décrit le fichier aux personnes qui ne le voient pas.",
        { altText: "Description obligatoire." },
      ),
    );
  }

  return ok(
    await deps.write.update(input.id, {
      altText,
      caption: input.caption?.trim() || null,
      folder: normaliserDossier(input.folder),
    }),
  );
}

/** Même normalisation qu'au téléversement — les deux doivent coïncider. */
function normaliserDossier(valeur: string | null): string | null {
  if (!valeur) return null;
  const chemin = valeur.split("/").map(slugify).filter(Boolean).join("/");
  return chemin || null;
}
