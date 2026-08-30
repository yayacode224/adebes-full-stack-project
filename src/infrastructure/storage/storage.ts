import type { SupabaseClient } from "@supabase/supabase-js";

import {
  MEDIA_EXTENSIONS,
  MEDIA_MAX_BYTES,
  MEDIA_MIME_TYPES,
  type MediaBucket,
} from "@/core/cms/entities/media-asset";
import type { MediaStoragePort } from "@/core/cms/ports/media.port";
import { AppError } from "@/core/shared/errors";
import { slugify } from "@/core/shared/slug";

import type { Database } from "../supabase/database.types";

/**
 * Adaptateur Supabase Storage — implémentation de `MediaStoragePort`.
 *
 * Les deux buckets sont créés par la migration 0011 :
 *   `media`     — images, 8 Mo, lecture publique
 *   `documents` — PDF, 20 Mo, lecture publique
 *
 * ---------------------------------------------------------------------------
 * LES LISTES DE TYPES ET DE TAILLES ONT ÉTÉ REMONTÉES DANS `core/` (LOT 7)
 * ---------------------------------------------------------------------------
 * Elles vivaient ici au Lot 3, faute de consommateur ailleurs. Le cas d'usage
 * `uploadMedia` doit désormais CHOISIR le bucket à partir du type réel du
 * fichier — une décision métier, prise dans `core/`, qui n'a pas le droit
 * d'importer l'infrastructure.
 *
 * La source de vérité est donc `core/cms/entities/media-asset.ts`, et ce
 * fichier la lit. Les noms historiques restent exportés : aucun import
 * existant n'est cassé, et il n'existe qu'une seule définition.
 */

export type BucketName = MediaBucket;

/** Types MIME acceptés, alignés sur les contraintes des buckets (0011). */
export const MIME_AUTORISES: Record<BucketName, readonly string[]> =
  MEDIA_MIME_TYPES;

export const TAILLE_MAX: Record<BucketName, number> = MEDIA_MAX_BYTES;

/** Extension déduite du type MIME réel, jamais du nom de fichier reçu. */
const EXTENSIONS: Record<string, string> = MEDIA_EXTENSIONS;

/**
 * Fabrique le chemin de stockage d'un fichier.
 *
 * ⚠️  LE NOM D'ORIGINE N'EST JAMAIS RÉUTILISÉ (§3.5 du Rapport 2).
 *
 * Un nom venu d'un poste utilisateur peut contenir des accents et des espaces
 * (« Photo campagne santé (1).JPG »), des séparateurs de chemin, ou une
 * extension mensongère — `.jpg` sur un exécutable.
 *
 * Le fichier stocké porte donc un nom entièrement régénéré :
 * `<dossier>/<uuid>.<ext>`, où l'extension est déduite du type MIME RÉEL
 * vérifié côté serveur. Le nom d'origine est conservé dans
 * `media_assets.filename`, pour l'affichage seulement.
 */
export function buildStoragePath(input: {
  bucket: BucketName;
  mimeType: string;
  folder?: string | null;
}): string {
  const extension = EXTENSIONS[input.mimeType];
  if (!extension) {
    throw new AppError(
      "STORAGE",
      "Ce type de fichier n'est pas accepté.",
    );
  }

  /*
   * Le dossier vient de l'utilisateur — il faut donc l'assainir, mais sans
   * massacrer le français.
   *
   * Chaque segment passe par `slugify`, qui sait traiter les accents et les
   * apostrophes : « Programmes/Santé » donne « programmes/sante ». Une simple
   * substitution des caractères non ASCII produisait « programmes/sant- »,
   * défaut relevé par la recette du Lot 3.
   *
   * La traversée de dossier disparaît par la même occasion : `slugify("..")`
   * renvoie une chaîne vide, et les segments vides sont écartés. Aucun « ../ »
   * ne peut donc sortir du bucket.
   */
  const dossier = (input.folder ?? "")
    .split("/")
    .map(slugify)
    .filter(Boolean)
    .join("/");

  const nom = `${crypto.randomUUID()}.${extension}`;
  return dossier ? `${dossier}/${nom}` : nom;
}

/**
 * Valide un fichier avant envoi.
 *
 * Le bucket applique déjà ces limites, mais échouer ici permet un message
 * français précis plutôt qu'une erreur Storage brute — et évite de téléverser
 * 12 Mo pour se les faire refuser à l'arrivée, ce qui compte sur une connexion
 * mobile.
 */
export function validerFichier(
  bucket: BucketName,
  fichier: { type: string; size: number },
): AppError | null {
  if (!MIME_AUTORISES[bucket].includes(fichier.type)) {
    return new AppError(
      "STORAGE",
      bucket === "media"
        ? "Format d'image non accepté. Utilisez JPG, PNG, WebP ou AVIF."
        : "Seuls les fichiers PDF sont acceptés.",
    );
  }

  if (fichier.size > TAILLE_MAX[bucket]) {
    const mo = Math.round(TAILLE_MAX[bucket] / (1024 * 1024));
    return new AppError(
      "STORAGE",
      `Ce fichier est trop volumineux (${mo} Mo maximum).`,
    );
  }

  return null;
}

export class SupabaseStorage implements MediaStoragePort {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  /**
   * Le port expose la fabrique de chemin comme une méthode.
   *
   * Elle délègue à `buildStoragePath`, qui reste une fonction pure et
   * testable sans client Supabase. Le cas d'usage, lui, n'a pas à savoir que
   * cette fonction existe : il ne connaît que son port.
   */
  buildPath(input: {
    bucket: BucketName;
    mimeType: string;
    folder?: string | null;
  }): string {
    return buildStoragePath(input);
  }

  /**
   * ⚠️  CORRECTIF HORS PÉRIMÈTRE — TROUVÉ PAR LA MIGRATION DU LOT 8H
   * ---------------------------------------------------------------------------
   * `supabase-js` IGNORE l'option `contentType` quand le corps est un `Blob` :
   * il construit alors un `FormData` et ajoute le fichier tel quel
   * (`storage-js/dist/index.cjs`, `uploadOrUpdate`). Le type transmis au bucket
   * est donc **`blob.type`**, jamais celui qu'on passe ici. L'option n'est lue
   * que dans la branche « ni Blob ni FormData ».
   *
   * Deux conséquences, toutes deux réelles et invisibles jusqu'ici :
   *
   *   1. **Un fichier sans type est REFUSÉ.** `File.type` est renseigné par le
   *      navigateur d'après l'EXTENSION : un JPEG valide nommé « photo », sans
   *      extension, arrive avec `type: ""`. Il traverse tout `uploadMedia` —
   *      qui, lui, lit les OCTETS — puis se fait refuser par le bucket
   *      (« mime type application/octet-stream is not supported »), et
   *      l'utilisateur lit « Le fichier n'a pas pu être enregistré.
   *      Réessayez. », c'est-à-dire une invitation à refaire ce qui échouera à
   *      l'identique.
   *   2. **Un fichier au type MENTEUR est stocké avec ce mensonge.** Un JPEG
   *      renommé `.png` s'annonce `image/png` : les deux types étant acceptés
   *      par le bucket, l'objet est écrit avec `Content-Type: image/png` alors
   *      que `media_assets.mime_type` — déduit des octets — dit `image/jpeg`.
   *      Le catalogue et le CDN se contredisent, et c'est le CDN que voit le
   *      visiteur.
   *
   * Le corps est donc RE-ÉTIQUETÉ avec le type réel avant l'envoi.
   * `Blob.slice(0, size, type)` renvoie une vue portant le nouveau type **sans
   * recopier les octets** — la mémoire n'est pas doublée sur un fichier de
   * 8 Mo.
   *
   * ⚠️  Ce n'est pas un contournement de la vérification : le type employé ici
   * est celui que `detectMimeType` a lu dans les octets (`uploadMedia`,
   * étape 1). On ne fait pas confiance au fichier — on cesse au contraire de
   * laisser SON étiquette décider à la place de la nôtre.
   */
  async upload(input: {
    bucket: BucketName;
    path: string;
    file: Blob | ArrayBuffer;
    mimeType: string;
  }): Promise<{ path: string }> {
    const corps =
      input.file instanceof Blob
        ? input.file.slice(0, input.file.size, input.mimeType)
        : new Blob([input.file], { type: input.mimeType });

    const { data, error } = await this.supabase.storage
      .from(input.bucket)
      .upload(input.path, corps, {
        // Conservé bien qu'ignoré pour un `Blob` : la branche `ArrayBuffer` de
        // `supabase-js`, elle, le lit — et le jour où l'implémentation change,
        // les deux chemins diront la même chose.
        contentType: input.mimeType,
        // `false` : un chemin est un UUID, il ne peut pas déjà exister. Si
        // c'était le cas, écraser masquerait un bug plutôt que de le révéler.
        upsert: false,
      });

    if (error) {
      throw new AppError(
        "STORAGE",
        "Le fichier n'a pas pu être enregistré. Réessayez.",
        undefined,
        error,
      );
    }

    return { path: data.path };
  }

  async remove(bucket: BucketName, paths: string[]): Promise<void> {
    if (paths.length === 0) return;

    const { error } = await this.supabase.storage.from(bucket).remove(paths);
    if (error) {
      throw new AppError(
        "STORAGE",
        "Le fichier n'a pas pu être supprimé.",
        undefined,
        error,
      );
    }
  }

  /**
   * URL publique d'un objet.
   *
   * Les buckets sont publics en lecture : pas de jeton signé, donc une URL
   * stable, mise en cache par le CDN et utilisable par `next/image`.
   *
   * ⚠️  Le domaine doit figurer dans `images.remotePatterns` de
   * `next.config.ts`, sans quoi `next/image` refuse l'image.
   */
  getPublicUrl(bucket: BucketName, path: string): string {
    return this.supabase.storage.from(bucket).getPublicUrl(path).data.publicUrl;
  }

  /**
   * URL transformée à la volée par Supabase.
   *
   * Utile pour les vignettes de la médiathèque : servir une image de 2400 px
   * dans une case de 200 px gaspille la bande passante de l'utilisateur.
   */
  getTransformedUrl(
    bucket: BucketName,
    path: string,
    options: { width?: number; height?: number; quality?: number },
  ): string {
    return this.supabase.storage.from(bucket).getPublicUrl(path, {
      transform: {
        width: options.width,
        height: options.height,
        quality: options.quality ?? 80,
        resize: "cover",
      },
    }).data.publicUrl;
  }
}
