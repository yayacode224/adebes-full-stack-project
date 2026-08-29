/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE TYPE RÉEL D'UN FICHIER, LU DANS SES PREMIERS OCTETS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §13 du Rapport 1, ligne « Upload malveillant » : « Type MIME et taille
 * validés côté serveur, extension recalculée ». Et la recette du Lot 7 en fait
 * un critère binaire :
 *
 *     « Un .exe renommé en .jpg est refusé (contrôle du MIME réel, pas de
 *       l'extension). »
 *
 * ---------------------------------------------------------------------------
 * POURQUOI `File.type` NE SUFFIT PAS
 * ---------------------------------------------------------------------------
 * `File.type` est renseigné par le NAVIGATEUR, à partir de l'extension du nom
 * de fichier — pas du contenu. Renommer `virus.exe` en `photo.jpg` suffit à ce
 * que le navigateur annonce `image/jpeg`, et une Server Action est de toute
 * façon joignable par un POST direct où cette valeur est ce que l'appelant
 * décide qu'elle soit.
 *
 * Le seul contrôle qui vaille lit donc le contenu. Ce fichier est ce contrôle.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI DANS `core/shared/` ET NON DANS `infrastructure/storage/`
 * ---------------------------------------------------------------------------
 * C'est une règle du domaine — « un fichier dont le contenu ne correspond pas
 * à ce qu'il annonce est refusé » — et non un détail de Supabase. Le cas
 * d'usage `uploadMedia` doit pouvoir l'appliquer sans dépendre d'un adaptateur,
 * et la fonction est pure : aucune dépendance, testable sans base ni réseau.
 */

/** Signature d'un format : des octets attendus à une position donnée. */
type Signature = {
  mimeType: string;
  offset: number;
  octets: readonly number[];
  /**
   * Contrôle supplémentaire pour les conteneurs dont l'en-tête ne suffit pas.
   * `RIFF` couvre WebP mais aussi WAV et AVI ; `ftyp` couvre AVIF, HEIC et
   * MP4.
   */
  verifier?: (octets: Uint8Array) => boolean;
};

/** Compare une suite d'octets à une position donnée. */
function correspond(
  donnees: Uint8Array,
  offset: number,
  attendus: readonly number[],
): boolean {
  if (donnees.length < offset + attendus.length) return false;
  for (let i = 0; i < attendus.length; i += 1) {
    if (donnees[offset + i] !== attendus[i]) return false;
  }
  return true;
}

/** Lit `longueur` octets en ASCII à partir de `offset`. */
function ascii(donnees: Uint8Array, offset: number, longueur: number): string {
  let texte = "";
  for (let i = offset; i < offset + longueur && i < donnees.length; i += 1) {
    texte += String.fromCharCode(donnees[i]);
  }
  return texte;
}

/**
 * Les signatures des six types acceptés par les buckets (migration 0011).
 *
 * L'ordre compte : la première qui correspond gagne. Les signatures les plus
 * spécifiques sont donc placées avant les conteneurs génériques.
 */
const SIGNATURES: readonly Signature[] = [
  // PNG — signature de 8 octets, la plus fiable du lot.
  {
    mimeType: "image/png",
    offset: 0,
    octets: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a],
  },

  // JPEG — SOI (Start Of Image). Le quatrième octet varie selon le marqueur
  // (JFIF, Exif, …), il n'est donc pas contrôlé.
  { mimeType: "image/jpeg", offset: 0, octets: [0xff, 0xd8, 0xff] },

  // PDF — `%PDF-`. Certains outils laissent quelques octets avant ; les
  // lecteurs tolèrent, notre contrôle non : un préfixe arbitraire est
  // exactement ce dont un fichier hybride a besoin.
  { mimeType: "application/pdf", offset: 0, octets: [0x25, 0x50, 0x44, 0x46, 0x2d] },

  // WebP — conteneur RIFF, dont le type est écrit en 8..11.
  {
    mimeType: "image/webp",
    offset: 0,
    octets: [0x52, 0x49, 0x46, 0x46], // "RIFF"
    verifier: (o) => ascii(o, 8, 4) === "WEBP",
  },

  // AVIF — conteneur ISOBMFF : `ftyp` en 4..7, marque en 8..11.
  // `avis` est la variante séquence d'images ; les deux sont servies comme
  // `image/avif`.
  {
    mimeType: "image/avif",
    offset: 4,
    octets: [0x66, 0x74, 0x79, 0x70], // "ftyp"
    verifier: (o) => {
      const marque = ascii(o, 8, 4);
      return marque === "avif" || marque === "avis";
    },
  },
];

/**
 * SVG : le seul format textuel de la liste, donc le seul sans signature
 * binaire.
 *
 * On cherche `<svg` dans le début du fichier, après avoir sauté un éventuel
 * prologue XML, une déclaration de type de document ou des commentaires. La
 * recherche est bornée aux premiers octets : au-delà, ce n'est plus un
 * en-tête, c'est du contenu — et un `<svg` trouvé à la ligne 400 d'un fichier
 * quelconque ne prouverait rien.
 */
const SVG_FENETRE = 1024;

function ressembleAUnSvg(donnees: Uint8Array): boolean {
  // Le BOM UTF-8 est sauté : un éditeur Windows l'ajoute silencieusement.
  const debut = correspond(donnees, 0, [0xef, 0xbb, 0xbf]) ? 3 : 0;
  const texte = ascii(donnees, debut, SVG_FENETRE).toLowerCase();

  if (!texte.includes("<svg")) return false;

  // Ce qui précède `<svg` doit rester du décor XML. Une balise inattendue
  // (`<html`, `<script` en tête) signale un fichier qui n'est pas un SVG.
  const avant = texte.slice(0, texte.indexOf("<svg"));
  return !/<(?!\?|!)/.test(avant);
}

/**
 * Le type MIME réel, ou `null` si le contenu ne correspond à aucun format
 * accepté.
 *
 * `null` est une RÉPONSE, pas une panne : c'est le cas du `.exe` renommé, et
 * l'appelant le traduit en refus lisible. Ne jamais retomber sur le type
 * annoncé par le navigateur en cas de doute — ce serait rendre tout ce fichier
 * inutile.
 */
export function detectMimeType(donnees: Uint8Array): string | null {
  for (const signature of SIGNATURES) {
    if (!correspond(donnees, signature.offset, signature.octets)) continue;
    if (signature.verifier && !signature.verifier(donnees)) continue;
    return signature.mimeType;
  }

  return ressembleAUnSvg(donnees) ? "image/svg+xml" : null;
}

/**
 * Nombre d'octets à lire pour que `detectMimeType` puisse conclure.
 *
 * Exposé pour les appelants qui n'ont pas besoin de charger 8 Mo en mémoire
 * pour vérifier un en-tête.
 */
export const TAILLE_ENTETE_A_LIRE = SVG_FENETRE;
