import {
  isMediaBucket,
  type CreateMediaAsset,
  type MediaAsset,
  type UpdateMediaAsset,
} from "@/core/cms/entities/media-asset";

import type { Database } from "../database.types";

type Ligne = Database["public"]["Tables"]["media_assets"]["Row"];
type Insertion = Database["public"]["Tables"]["media_assets"]["Insert"];
type Modification = Database["public"]["Tables"]["media_assets"]["Update"];

/**
 * Le SEUL endroit où l'on passe de `snake_case` à `camelCase` pour les médias.
 *
 * Aucun composant ne doit jamais voir `alt_text` ni `size_bytes` (§3.2 du
 * Rapport 2).
 */

/**
 * `bucket` est un `text` en base, pas un énuméré.
 *
 * Une ligne dont le bucket serait inconnu retomberait donc sur `media` —
 * mais ce serait un mensonge silencieux, et l'URL construite ensuite pointerait
 * nulle part. On préfère assumer la valeur telle quelle en la validant : une
 * valeur inattendue est signalée au journal, et la ligne est rangée dans
 * `media`, seul choix qui rende une vignette plutôt qu'un vide.
 */
function bucketDeLaLigne(valeur: string): MediaAsset["bucket"] {
  if (isMediaBucket(valeur)) return valeur;

  console.error("[ADEBES] Bucket inconnu dans media_assets", valeur);
  return "media";
}

export function toMediaAsset(ligne: Ligne): MediaAsset {
  return {
    id: ligne.id,
    bucket: bucketDeLaLigne(ligne.bucket),
    path: ligne.path,
    filename: ligne.filename,
    mimeType: ligne.mime_type,
    sizeBytes: ligne.size_bytes,
    width: ligne.width,
    height: ligne.height,
    altText: ligne.alt_text,
    caption: ligne.caption,
    folder: ligne.folder,
    uploadedBy: ligne.uploaded_by,
    createdAt: ligne.created_at,
  };
}

export function toMediaAssetInsert(input: CreateMediaAsset): Insertion {
  return {
    bucket: input.bucket,
    path: input.path,
    filename: input.filename,
    mime_type: input.mimeType,
    size_bytes: input.sizeBytes,
    width: input.width,
    height: input.height,
    alt_text: input.altText,
    caption: input.caption,
    folder: input.folder,
    uploaded_by: input.uploadedBy ?? null,
  };
}

/**
 * Modification partielle.
 *
 * Seules les clés RÉELLEMENT présentes sont transmises : envoyer
 * `{ caption: undefined }` ferait écrire `null` par PostgREST, ce qui effacerait
 * une légende que personne n'a touchée.
 */
export function toMediaAssetUpdate(input: UpdateMediaAsset): Modification {
  const champs: Modification = {};

  if (input.altText !== undefined) champs.alt_text = input.altText;
  if (input.caption !== undefined) champs.caption = input.caption;
  if (input.folder !== undefined) champs.folder = input.folder;

  return champs;
}
