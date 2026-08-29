import type { MediaAsset } from "@/core/cms/entities/media-asset";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DE `bucket` + `path` À UNE URL
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §7.3 du Rapport 2 : le contenu référence un `mediaId`, JAMAIS une URL — « la
 * résolution en URL est faite au rendu, ce qui permet de déplacer le stockage
 * sans réécrire le contenu ». Ce fichier est cette résolution, et il est le
 * seul endroit du dépôt qui sache à quoi ressemble une URL Supabase Storage.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI DANS `lib/` ET NON DANS `infrastructure/storage/`
 * ---------------------------------------------------------------------------
 * `SupabaseStorage.getPublicUrl()` existe déjà, mais il exige un client
 * Supabase — donc une session, donc le serveur. Or c'est un COMPOSANT qui a
 * besoin de l'URL, y compris côté client (la grille de la médiathèque, le
 * `<MediaPicker>`), et la règle de dépendance du §4 interdit à
 * `src/components/**` d'importer `src/infrastructure/**`.
 *
 * L'URL publique d'un bucket public est de toute façon DÉTERMINISTE : il n'y a
 * ni jeton, ni signature, ni appel réseau à faire. La calculer ici est exact,
 * synchrone, et utilisable des deux côtés de la frontière.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNIQUEMENT `/object/public/` — JAMAIS `/render/image/`
 * ---------------------------------------------------------------------------
 * Supabase sait redimensionner à la volée sur `/storage/v1/render/image/
 * public/…`. C'est tentant pour les vignettes, et c'est un piège ici :
 * `next.config.ts` n'autorise que `pathname: "/storage/v1/object/public/**"`.
 * Une URL de rendu serait refusée par `next/image` — et le §7 nous prévient
 * que l'erreur de domaine est « la première cause d'écran vide au Lot 7 ».
 *
 * Le redimensionnement est donc confié à `next/image`, qui le fait déjà, en
 * AVIF ou WebP, avec un `sizes` explicite. Une transformation Supabase par
 * dessus reviendrait à optimiser deux fois la même image.
 */

/** Racine du projet Supabase, ou `null` si la variable n'est pas renseignée. */
function racine(): string | null {
  /*
   * Lu directement plutôt que par `requireSupabaseEnv()` : ce module est
   * importé par des composants clients, où une exception au rendu remplacerait
   * une image manquante par un écran blanc.
   *
   * Une variable DÉCLARÉE MAIS VIDE vaut `""` et non `undefined` (§15,
   * règle 16 du Rapport 1) — d'où le `trim()` plutôt qu'un simple `??`.
   */
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  return url ? url.replace(/\/+$/, "") : null;
}

/**
 * L'URL publique d'un média, ou `null` si elle ne peut pas être construite.
 *
 * `null` est une réponse valable, et les appelants doivent la traiter : c'est
 * l'invariant nº 2 du projet (« aucun lien mort »). Rendre une balise `<img>`
 * pointant vers `undefined/storage/...` afficherait une icône d'image cassée,
 * là où un `MediaPlaceholder` reste présentable.
 */
export function urlMedia(
  asset: Pick<MediaAsset, "bucket" | "path"> | null | undefined,
): string | null {
  if (!asset?.path) return null;

  const base = racine();
  if (!base) return null;

  // Chaque segment est encodé séparément : les `/` du chemin sont des
  // séparateurs, pas des caractères à échapper. Les chemins produits par
  // `buildStoragePath` sont déjà sûrs (slug + UUID) ; l'encodage protège des
  // lignes plus anciennes ou importées à la main.
  const chemin = asset.path
    .split("/")
    .filter(Boolean)
    .map(encodeURIComponent)
    .join("/");

  return `${base}/storage/v1/object/public/${asset.bucket}/${chemin}`;
}

/**
 * `next/image` doit-il laisser ce fichier tel quel ?
 *
 * Deux cas :
 *
 *   * **SVG** — l'optimiseur le refuse tant que `dangerouslyAllowSVG` n'est pas
 *     activé, et l'activer ferait servir depuis notre domaine un format qui
 *     peut embarquer du script. La migration 0011 signale déjà ce risque et le
 *     renvoie au Lot 16. En attendant, l'image est servie NON OPTIMISÉE, donc
 *     directement depuis le domaine Supabase.
 *     (La documentation de `next/image` le fait d'ailleurs automatiquement
 *     quand `src` se termine par « .svg » ; c'est explicité ici pour que le
 *     comportement ne dépende pas d'une extension.)
 *
 *   * **PDF** — ce n'est pas une image : il n'est jamais passé à `next/image`.
 */
export function doitResterNonOptimise(mimeType: string): boolean {
  return mimeType === "image/svg+xml";
}

/**
 * Poids d'un fichier, en français.
 *
 * `1 023 octets`, `847 Ko`, `2,4 Mo` — jamais `0.8 MB`. Le séparateur décimal
 * et l'espace insécable viennent d'`Intl`, comme partout ailleurs sur le site.
 */
export function formaterPoids(octets: number): string {
  if (octets < 1024) {
    return `${new Intl.NumberFormat("fr-FR").format(octets)} octets`;
  }

  if (octets < 1024 * 1024) {
    return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 0 }).format(octets / 1024)} Ko`;
  }

  return `${new Intl.NumberFormat("fr-FR", { maximumFractionDigits: 1 }).format(octets / (1024 * 1024))} Mo`;
}

/** `1920 × 1080`, ou `null` quand les dimensions n'ont pas pu être mesurées. */
export function formaterDimensions(
  asset: Pick<MediaAsset, "width" | "height">,
): string | null {
  if (!asset.width || !asset.height) return null;

  const nombre = new Intl.NumberFormat("fr-FR");
  return `${nombre.format(asset.width)} × ${nombre.format(asset.height)} pixels`;
}
