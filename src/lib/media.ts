import fs from "node:fs";
import path from "node:path";

/**
 * Détection de la présence réelle d'un média dans /public.
 *
 * Le site est construit *avant* que l'association ne fournisse sa photothèque.
 * Plutôt que de coder des images factices en dur (qu'il faudrait ensuite
 * retrouver et remplacer une par une), chaque emplacement référence dès
 * maintenant son chemin définitif — celui de la convention de nommage. Tant que
 * le fichier n'existe pas, un placeholder est rendu à sa place ; le jour où le
 * fichier est déposé au bon chemin, l'image réelle apparaît sans toucher au
 * code.
 *
 * Ne s'exécute que côté serveur (rendu / build). Les Client Components
 * reçoivent le résultat via des props.
 */

const publicDir = path.join(process.cwd(), "public");

/** Le résultat est mémoïsé : le contenu de /public ne change pas en cours de build. */
const cache = new Map<string, ResolvedMedia>();

/**
 * Extensions testées pour un même chemin logique, **par ordre de priorité
 * décroissante**.
 *
 * L'association dépose ses visuels dans le format dont elle dispose, et fait
 * souvent cohabiter deux versions du même visuel sous le même nom
 * (`cover.jpeg` livré au départ, `cover.png` déposé ensuite en remplacement).
 * L'ordre ci-dessous tranche : **PNG, puis JPEG, puis SVG**. Le fichier gagnant
 * ne dépend donc pas de l'extension écrite dans le code, mais de ce qui est
 * réellement présent dans /public — déposer un `.png` à côté d'un `.jpeg`
 * suffit à remplacer le visuel, sans toucher au code.
 *
 * `.jpg` suit immédiatement `.jpeg` (même format, deux orthographes) ; `.webp`
 * et `.avif` ferment la marche en dernier recours, pour ne pas perdre un visuel
 * qui n'existerait que dans l'un de ces formats.
 */
export const MEDIA_EXTENSIONS: readonly string[] = [
  ".png",
  ".jpeg",
  ".jpg",
  ".svg",
  ".webp",
  ".avif",
];

/**
 * Rang d'un fichier dans l'ordre de priorité — plus la valeur est basse, plus
 * le fichier prime. Sert à départager deux fichiers de même nom là où le choix
 * ne se fait pas par `resolveMedia` (voir `content/galerie.ts`, qui lit un
 * dossier entier).
 */
export function mediaExtensionRank(file: string): number {
  const index = MEDIA_EXTENSIONS.indexOf(path.extname(file).toLowerCase());
  return index === -1 ? MEDIA_EXTENSIONS.length : index;
}

export type ResolvedMedia = {
  /** true si un fichier réel a été trouvé dans /public. */
  available: boolean;
  /** Chemin à passer à next/image (extension corrigée si nécessaire). */
  src: string;
};

export function resolveMedia(src: string): ResolvedMedia {
  const cached = cache.get(src);
  if (cached) return cached;

  const result = lookup(src);
  cache.set(src, result);
  return result;
}

function lookup(src: string): ResolvedMedia {
  const normalized = src.startsWith("/") ? src.slice(1) : src;
  const ext = path.extname(normalized).toLowerCase();

  // Fichier hors périmètre image — un rapport PDF de la page Impact, par
  // exemple : aucune substitution d'extension n'aurait de sens, seul le chemin
  // exact est vérifié.
  if (!MEDIA_EXTENSIONS.includes(ext)) {
    return {
      available: fileExists(path.join(publicDir, normalized)),
      src,
    };
  }

  // Même nom logique, extensions testées dans l'ordre de priorité — et non en
  // partant de celle écrite dans le code. C'est ce qui permet à un `.png`
  // déposé à côté d'un `.jpeg` de le remplacer partout d'un coup.
  const base = normalized.slice(0, -ext.length);
  for (const candidate of MEDIA_EXTENSIONS) {
    if (fileExists(path.join(publicDir, base + candidate))) {
      return { available: true, src: `/${base}${candidate}` };
    }
  }

  return { available: false, src };
}

function fileExists(absolute: string): boolean {
  try {
    return fs.statSync(absolute).isFile();
  } catch {
    return false;
  }
}
