import type { ListFilter } from "../../shared/pagination";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UN FICHIER DE LA MÉDIATHÈQUE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reprise fidèle de la table `media_assets` (migration 0004), en `camelCase` :
 * la forme SQL (`alt_text`, `size_bytes`) ne franchit jamais le mapper.
 *
 * ---------------------------------------------------------------------------
 * CE QUE CETTE ENTITÉ NE PORTE PAS : L'URL
 * ---------------------------------------------------------------------------
 * `bucket` + `path` sont la vérité ; l'URL en est une DÉRIVÉE, propre au
 * stockage du moment. La mettre ici la ferait entrer dans le domaine, et le
 * jour où le stockage change, c'est l'entité qu'il faudrait modifier.
 *
 * La résolution vit donc côté présentation, dans `src/lib/media-url.ts`.
 * C'est aussi ce qui rend vraie la promesse du §7.3 du Rapport 2 : le contenu
 * référence un `mediaId`, jamais une URL, « ce qui permet de déplacer le
 * stockage sans réécrire le contenu ».
 */
export type MediaAsset = {
  id: string;
  bucket: MediaBucket;
  /** Chemin dans le bucket : `<dossier>/<uuid>.<ext>`. Unique. */
  path: string;
  /**
   * Nom d'origine, pour l'affichage SEULEMENT.
   *
   * Le fichier réellement stocké porte un nom régénéré (§3.5 du Rapport 2) :
   * un nom venu d'un poste utilisateur peut contenir des accents, des espaces,
   * des séparateurs de chemin, ou une extension mensongère.
   */
  filename: string;
  /** Type MIME RÉEL, déduit des premiers octets — jamais celui annoncé. */
  mimeType: string;
  sizeBytes: number;
  /** `null` pour un PDF, ou quand les dimensions n'ont pas pu être mesurées. */
  width: number | null;
  height: number | null;
  /**
   * ⚠️  JAMAIS VIDE. `media_assets.alt_text` est `not null` (WCAG 1.1.1), et
   * le formulaire de téléversement l'exige AVANT l'envoi plutôt que de laisser
   * la base refuser l'écriture.
   */
  altText: string;
  caption: string | null;
  /** Dossier de rangement, assaini par `slugify`. `null` = racine. */
  folder: string | null;
  uploadedBy: string | null;
  createdAt: string;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * Buckets
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Les deux buckets créés par la migration 0011.
 *
 * Déclarés ICI et non dans `infrastructure/storage/` : le cas d'usage de
 * téléversement doit choisir le bucket à partir du type réel du fichier, et
 * `core/` n'a pas le droit d'importer l'infrastructure. C'est l'infrastructure
 * qui lit cette liste, pas l'inverse.
 */
export const MEDIA_BUCKETS = ["media", "documents"] as const;

export type MediaBucket = (typeof MEDIA_BUCKETS)[number];

export function isMediaBucket(valeur: unknown): valeur is MediaBucket {
  return (
    typeof valeur === "string" &&
    (MEDIA_BUCKETS as readonly string[]).includes(valeur)
  );
}

/**
 * Types MIME acceptés par bucket — alignés sur les contraintes posées en 0011.
 *
 * Les deux listes doivent rester identiques : le bucket refuserait de toute
 * façon un type absent de la sienne, mais avec une erreur Storage brute au
 * lieu d'un message français.
 */
export const MEDIA_MIME_TYPES: Record<MediaBucket, readonly string[]> = {
  media: ["image/jpeg", "image/png", "image/webp", "image/avif", "image/svg+xml"],
  documents: ["application/pdf"],
};

/** Limites du §7.2 du Rapport 2, égales à celles des buckets. */
export const MEDIA_MAX_BYTES: Record<MediaBucket, number> = {
  media: 8 * 1024 * 1024,
  documents: 20 * 1024 * 1024,
};

/** Extension déduite du type MIME RÉEL, jamais du nom de fichier reçu. */
export const MEDIA_EXTENSIONS: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/avif": "avif",
  "image/svg+xml": "svg",
  "application/pdf": "pdf",
};

/** Le bucket qui accueille ce type MIME, ou `null` s'il n'est pas accepté. */
export function bucketPourMimeType(mimeType: string): MediaBucket | null {
  for (const bucket of MEDIA_BUCKETS) {
    if (MEDIA_MIME_TYPES[bucket].includes(mimeType)) return bucket;
  }
  return null;
}

export function estImage(mimeType: string): boolean {
  return mimeType.startsWith("image/");
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Ce qu'un champ `media` accepte
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Reprise littérale de `FieldDescriptor.accept` (§10 du Rapport 1).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `video` N'A AUCUN BUCKET, ET C'EST VOULU
 * ---------------------------------------------------------------------------
 * La migration 0011 ne crée que `media` (images) et `documents` (PDF) : aucun
 * type vidéo n'est accepté nulle part, ni en base, ni côté Storage. Le §10
 * déclare pourtant `accept: 'image' | 'document' | 'video'`.
 *
 * Plutôt que d'inventer un troisième bucket qu'aucun rapport ne demande, le
 * `<MediaPicker>` rend pour `video` un état « indisponible » explicite. C'est
 * l'invariant nº 1 transposé aux médias : ne jamais laisser une absence passer
 * pour une donnée — ici, une grille vide laisserait croire qu'aucune vidéo n'a
 * encore été téléversée, alors qu'aucune ne PEUT l'être.
 *
 * Le site public embarque ses vidéos par `VideoEmbed`, à partir d'une URL —
 * il n'y a donc pas de besoin non couvert.
 */
export const MEDIA_ACCEPTS = ["image", "document", "video"] as const;

export type MediaAccept = (typeof MEDIA_ACCEPTS)[number];

/** Le bucket où chercher pour ce type de champ. `null` = aucun (voir ci-dessus). */
export function bucketPourAccept(accept: MediaAccept): MediaBucket | null {
  if (accept === "image") return "media";
  if (accept === "document") return "documents";
  return null;
}

/** Libellé français, au singulier, accordé au masculin ou au féminin. */
export const MEDIA_ACCEPT_LABELS: Record<
  MediaAccept,
  { singulier: string; pluriel: string; feminin: boolean }
> = {
  image: { singulier: "image", pluriel: "images", feminin: true },
  document: { singulier: "document", pluriel: "documents", feminin: false },
  video: { singulier: "vidéo", pluriel: "vidéos", feminin: true },
};

/* ═══════════════════════════════════════════════════════════════════════════
 * Écriture
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Ce qui est inscrit au catalogue APRÈS que le fichier a rejoint le bucket.
 *
 * `uploadedBy` est facultatif : la base le renseigne rarement seule, mais une
 * ligne dont l'auteur a été supprimé le remet à `null` (`on delete set null`).
 */
export type CreateMediaAsset = Omit<MediaAsset, "id" | "createdAt" | "uploadedBy"> & {
  uploadedBy?: string | null;
};

/**
 * Ce qu'un administrateur peut corriger après coup.
 *
 * ⚠️  Ni `path`, ni `bucket`, ni `mimeType`, ni `sizeBytes` : ces valeurs
 * décrivent un fichier déjà écrit. Les laisser modifiables permettrait de faire
 * mentir le catalogue sur le contenu réel du bucket — exactement ce que la
 * contrainte `unique` sur `path` cherche à empêcher.
 */
export type UpdateMediaAsset = {
  altText?: string;
  caption?: string | null;
  folder?: string | null;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * Filtrage
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Familles proposées au filtre de la médiathèque. */
export const MEDIA_KINDS = ["image", "document"] as const;

export type MediaKind = (typeof MEDIA_KINDS)[number];

export const MEDIA_KIND_LABELS: Record<MediaKind, string> = {
  image: "Images",
  document: "Documents",
};

/**
 * Filtre de liste de la médiathèque.
 *
 * `status` de `ListFilter` reste inutilisé : `media_assets` ne porte pas de
 * statut éditorial — un fichier est là ou il n'y est pas.
 */
export type MediaFilter = ListFilter & {
  kind?: MediaKind;
  /** Dossier exact. La chaîne vide désigne la racine. */
  folder?: string;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * Usages
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Un endroit du site où ce média est employé.
 *
 * §7 du Rapport 2 : « Supprimer un média utilisé affiche la liste des usages
 * et demande confirmation. » Sans cette liste, l'utilisateur supprime à
 * l'aveugle et découvre le trou sur le site public.
 */
export type MediaUsage = {
  /** Libellé français de la collection : « Programme », « Article »… */
  resource: string;
  /** Titre de l'élément concerné, tel qu'il apparaît dans le dashboard. */
  label: string;
  id: string;
  /** Champ concerné : « Image de couverture », « Photo »… */
  field: string;
  /**
   * La suppression est-elle IMPOSSIBLE tant que cet usage existe ?
   *
   * Deux cas, et ils viennent tous les deux de la base :
   *
   *   1. `on delete restrict` — `gallery_items.media_id` et
   *      `annual_reports.document_media_id`. PostgreSQL refusera, et il aura
   *      raison : un élément de galerie sans image n'a aucun sens.
   *
   *   2. `programmes.gallery_media_ids` est un `uuid[]`, donc SANS clé
   *      étrangère. La base laisserait passer la suppression et le tableau
   *      garderait un identifiant qui ne pointe plus sur rien — un lien mort,
   *      ce que l'invariant nº 2 du projet interdit. C'est donc bloquant ici,
   *      faute de l'être en base.
   *
   * Les autres références sont en `on delete set null` : la suppression les
   * vide proprement, l'élément retombe sur son `MediaPlaceholder`.
   */
  blocking: boolean;
};
