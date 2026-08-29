import {
  bucketPourMimeType,
  MEDIA_MAX_BYTES,
  type MediaAsset,
} from "../../cms/entities/media-asset";
import type { MediaDeps } from "../../cms/ports/media.port";
import { AppError } from "../../shared/errors";
import { detectMimeType } from "../../shared/file-signature";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TÉLÉVERSER UN FICHIER
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * C'est le seul cas d'usage du projet qui écrit dans DEUX systèmes sans
 * transaction commune : le bucket (l'octet) puis la table `media_assets` (le
 * catalogue). L'ordre et la compensation sont donc l'essentiel de ce fichier.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LE FICHIER D'ABORD, LE CATALOGUE ENSUITE
 * ---------------------------------------------------------------------------
 * Les deux ordres laissent une trace en cas de panne, mais pas la même :
 *
 *   * catalogue puis fichier → une ligne qui pointe vers un objet inexistant.
 *     Elle apparaît dans la grille, dans le `<MediaPicker>`, et un éditeur la
 *     choisit pour une couverture. Résultat : une image cassée en production,
 *     et l'invariant nº 2 (« aucun lien mort ») rompu.
 *
 *   * fichier puis catalogue → un objet que rien ne référence. Invisible,
 *     inoffensif, et RATTRAPABLE : on le supprime tout de suite (voir la
 *     compensation plus bas).
 *
 * Le second ordre est donc le seul acceptable.
 */
export type UploadMediaCommand = {
  file: Blob & { name?: string };
  /** Nom d'origine, conservé pour l'affichage seulement. */
  filename: string;
  altText: string;
  caption: string | null;
  folder: string | null;
  width: number | null;
  height: number | null;
  /** Identifiant de l'acteur, inscrit dans `uploaded_by`. */
  uploadedBy: string | null;
};

export async function uploadMedia(
  deps: MediaDeps,
  input: UploadMediaCommand,
): Promise<Result<MediaAsset>> {
  const octets = new Uint8Array(await input.file.arrayBuffer());

  if (octets.length === 0) {
    return err(
      new AppError("VALIDATION", "Ce fichier est vide.", {
        file: "Fichier vide.",
      }),
    );
  }

  /* ------------------------------------------------------------------ 1 ---
   * Le type RÉEL, lu dans les octets.
   *
   * `File.type` est renseigné par le navigateur à partir de l'EXTENSION : un
   * `.exe` renommé en `.jpg` s'annonce `image/jpeg`. Il n'est donc pas lu ici,
   * pas même à titre indicatif — s'en servir comme repli reviendrait à ne rien
   * contrôler du tout.
   */
  const mimeType = detectMimeType(octets);

  if (!mimeType) {
    return err(
      new AppError(
        "VALIDATION",
        "Ce fichier n'est pas une image ni un PDF valide. Formats acceptés : JPG, PNG, WebP, AVIF, SVG et PDF.",
        { file: "Format non reconnu." },
      ),
    );
  }

  /* ------------------------------------------------------------------ 2 ---
   * Le bucket découle du type réel, jamais d'un choix de l'appelant : un PDF
   * ne peut pas atterrir dans le bucket des images, dont la limite de taille
   * et la liste MIME sont différentes.
   */
  const bucket = bucketPourMimeType(mimeType);

  if (!bucket) {
    return err(
      new AppError(
        "VALIDATION",
        "Ce type de fichier n'est pas accepté par la médiathèque.",
        { file: "Format non accepté." },
      ),
    );
  }

  /* ------------------------------------------------------------------ 3 ---
   * Taille, avec la limite du bucket concerné.
   *
   * Le bucket refuserait de toute façon (contrainte posée en 0011), mais avec
   * une erreur Storage brute. Le message français précis vaut mieux — et il
   * évite d'envoyer 12 Mo pour se les faire refuser à l'arrivée, ce qui compte
   * sur une connexion mobile.
   */
  if (octets.length > MEDIA_MAX_BYTES[bucket]) {
    const mo = Math.round(MEDIA_MAX_BYTES[bucket] / (1024 * 1024));
    return err(
      new AppError(
        "VALIDATION",
        bucket === "media"
          ? `Cette image est trop lourde (${mo} Mo maximum).`
          : `Ce document est trop lourd (${mo} Mo maximum).`,
        { file: `${mo} Mo maximum.` },
      ),
    );
  }

  /* ------------------------------------------------------------------ 4 ---
   * Dossier, assaini de la même façon que le chemin de stockage.
   *
   * Sans cette normalisation, le catalogue enregistrerait « Programmes/Santé »
   * pendant que le fichier vivrait sous « programmes/sante » : le filtre par
   * dossier de la médiathèque ne retrouverait plus ses petits.
   */
  const folder = normaliserDossier(input.folder);

  /* ------------------------------------------------------------------ 5 ---
   * Écriture du fichier. Le nom est REGÉNÉRÉ (`<uuid>.<ext>`), l'extension
   * déduite du type réel.
   */
  const { path } = await deps.storage.upload({
    bucket,
    path: deps.storage.buildPath({ bucket, mimeType, folder }),
    file: input.file,
    mimeType,
  });

  /* ------------------------------------------------------------------ 6 ---
   * Inscription au catalogue — et compensation si elle échoue.
   *
   * Le `catch` ne masque rien : il retire l'objet devenu orphelin puis
   * relance l'erreur d'origine, que `createAction` traduira. Un échec de la
   * compensation elle-même ne doit pas remplacer l'erreur utile par une
   * erreur de nettoyage, d'où le second `catch` silencieux — et le journal.
   */
  try {
    return ok(
      await deps.write.create({
        bucket,
        path,
        filename: nomAffichable(input.filename),
        mimeType,
        sizeBytes: octets.length,
        width: input.width,
        height: input.height,
        altText: input.altText.trim(),
        caption: input.caption?.trim() || null,
        folder,
        uploadedBy: input.uploadedBy,
      }),
    );
  } catch (erreur) {
    try {
      await deps.storage.remove(bucket, [path]);
    } catch (erreurDeNettoyage) {
      console.error(
        "[ADEBES] Fichier orphelin dans le bucket après échec du catalogue",
        { bucket, path, erreurDeNettoyage },
      );
    }
    throw erreur;
  }
}

/** `null` pour la racine, sinon un chemin de segments assainis. */
function normaliserDossier(valeur: string | null): string | null {
  if (!valeur) return null;

  const chemin = valeur
    .split("/")
    .map(slugify)
    .filter(Boolean)
    .join("/");

  return chemin || null;
}

/**
 * Nom d'origine ramené à quelque chose d'affichable.
 *
 * Il n'est utilisé QUE pour l'affichage et la recherche : le fichier stocké
 * porte un UUID (§3.5 du Rapport 2). On retire donc seulement ce qui pourrait
 * tromper l'œil — les séparateurs de chemin, qui laisseraient croire à une
 * arborescence, et les caractères de contrôle, invisibles à l'écran.
 *
 * Le tri se fait par code de point plutôt que par expression régulière : la
 * plage des caractères de contrôle déclencherait la règle ESLint
 * `no-control-regex`, et une désactivation locale pour une boucle de trois
 * lignes serait un mauvais échange.
 */
function nomAffichable(filename: string): string {
  let nom = "";

  for (const caractere of filename.replace(/[\\/]/g, " ")) {
    const code = caractere.codePointAt(0) ?? 0;
    if (code < 0x20 || code === 0x7f) continue;
    nom += caractere;
  }

  return nom.trim().slice(0, 160) || "fichier";
}
