import {
  MEDIA_MAX_BYTES,
  MEDIA_MIME_TYPES,
  bucketPourMimeType,
} from "@/core/cms/entities/media-asset";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPRESSION CÔTÉ CLIENT, AVANT L'ENVOI
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §7.2 du Rapport 2 : « Compression côté client avant envoi (canvas, qualité
 * 0,85, largeur max 2400 px) — déterminant sur une connexion camerounaise. »
 *
 * Ce n'est pas une optimisation de confort. Une photo de téléphone récent pèse
 * 4 à 8 Mo ; réduite à 2400 px de large en WebP, elle tombe entre 200 et
 * 600 Ko. Sur une connexion mobile à 200 Ko/s, l'envoi passe de quarante
 * secondes à trois — et surtout, il ne s'interrompt plus.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI WEBP EN SORTIE
 * ---------------------------------------------------------------------------
 * C'est le seul format de la liste autorisée (migration 0011) qui soit à la
 * fois compressé avec perte ET porteur de transparence. Recompresser un PNG en
 * JPEG ferait virer au noir le fond transparent d'un logo ; le garder en PNG
 * n'apporterait aucun gain, `toBlob` ignorant le paramètre de qualité.
 *
 * ---------------------------------------------------------------------------
 * CE QUI N'EST JAMAIS TOUCHÉ
 * ---------------------------------------------------------------------------
 *   * les **PDF** — un canevas ne sait pas les lire ;
 *   * les **SVG** — ce sont des instructions de dessin, pas des pixels : les
 *     rasteriser détruirait précisément ce qui fait leur intérêt ;
 *   * toute image que la compression n'allège PAS. Le cas existe (photo déjà
 *     optimisée, petite image) et réécrire un fichier pour le rendre plus lourd
 *     serait absurde.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER NE PROTÈGE RIEN
 * ---------------------------------------------------------------------------
 * Tout ce qui se passe ici est du CONFORT. La validation qui compte — type
 * réel lu dans les octets, taille, texte alternatif — est refaite côté serveur
 * par `uploadMedia`, parce qu'une Server Action est joignable sans passer par
 * cette page.
 */

/** Largeur maximale conservée. Au-delà, l'image est réduite. */
const LARGEUR_MAX = 2400;

/** Qualité WebP, valeur du §7.2. */
const QUALITE = 0.85;

/**
 * Dimensions recommandées pour une image de couverture.
 *
 * En deçà, l'utilisateur reçoit un AVERTISSEMENT — jamais un refus : c'est ce
 * que demande le §7.2, et c'est le bon arbitrage. Une photo de 900 px de large
 * reste utilisable dans une carte ; l'interdire ferait renoncer quelqu'un qui
 * n'a que cette photo-là.
 */
export const LARGEUR_RECOMMANDEE = 1200;
export const HAUTEUR_RECOMMANDEE = 630;

export type FichierPrepare = {
  /** Identifiant local, pour les clés React et le suivi d'état. */
  cle: string;
  /** Ce qui sera réellement envoyé — compressé, ou l'original. */
  fichier: File;
  /** Nom d'origine, affiché tel quel. */
  nomOrigine: string;
  taillOrigine: number;
  width: number | null;
  height: number | null;
  /** URL d'objet pour l'aperçu. À révoquer quand la file est vidée. */
  apercu: string | null;
  compresse: boolean;
  /** Motif de refus immédiat, ou `null`. */
  refus: string | null;
  /** Avertissement non bloquant (image plus petite que recommandé). */
  avertissement: string | null;
};

let compteur = 0;

/**
 * Prépare un fichier choisi par l'utilisateur.
 *
 * Ne lève jamais : un fichier illisible devient un `refus` affiché à côté de
 * son nom. Sur un choix multiple, une photo corrompue ne doit pas faire
 * disparaître les onze autres.
 */
export async function preparerFichier(fichier: File): Promise<FichierPrepare> {
  compteur += 1;
  const cle = `fichier-${compteur}-${fichier.name}`;

  const base: FichierPrepare = {
    cle,
    fichier,
    nomOrigine: fichier.name,
    taillOrigine: fichier.size,
    width: null,
    height: null,
    apercu: null,
    compresse: false,
    refus: null,
    avertissement: null,
  };

  /*
   * Premier tri sur le type ANNONCÉ par le navigateur.
   *
   * Il n'est pas digne de confiance — c'est tout l'objet de
   * `detectMimeType` côté serveur — mais il évite de charger en mémoire un
   * fichier de 300 Mo pour découvrir ensuite que c'est une archive. Un fichier
   * qui passe ici peut encore être refusé au serveur, et c'est très bien.
   */
  const typesAcceptes = [
    ...MEDIA_MIME_TYPES.media,
    ...MEDIA_MIME_TYPES.documents,
  ];

  if (fichier.type && !typesAcceptes.includes(fichier.type)) {
    return {
      ...base,
      refus:
        "Format non accepté. Utilisez une image (JPG, PNG, WebP, AVIF, SVG) ou un PDF.",
    };
  }

  const bucket = bucketPourMimeType(fichier.type) ?? "media";

  // Les PDF et les SVG partent tels quels.
  if (fichier.type === "application/pdf" || fichier.type === "image/svg+xml") {
    return {
      ...base,
      refus: verifierTaille(fichier.size, bucket),
      apercu: fichier.type === "image/svg+xml" ? URL.createObjectURL(fichier) : null,
    };
  }

  const apercu = URL.createObjectURL(fichier);

  let image: HTMLImageElement;
  try {
    image = await chargerImage(apercu);
  } catch {
    URL.revokeObjectURL(apercu);
    return {
      ...base,
      refus: "Ce fichier n'a pas pu être lu comme une image.",
    };
  }

  const largeur = image.naturalWidth;
  const hauteur = image.naturalHeight;

  const avertissement =
    largeur < LARGEUR_RECOMMANDEE || hauteur < HAUTEUR_RECOMMANDEE
      ? `Cette image fait ${largeur} × ${hauteur} pixels. Pour une image de couverture, ${LARGEUR_RECOMMANDEE} × ${HAUTEUR_RECOMMANDEE} est recommandé — en dessous, elle paraîtra floue sur grand écran.`
      : null;

  const compresse = await compresser(image, fichier);

  // La compression n'est retenue que si elle allège réellement.
  const retenu = compresse && compresse.size < fichier.size ? compresse : null;

  return {
    ...base,
    fichier: retenu ?? fichier,
    width: largeur,
    height: hauteur,
    apercu,
    compresse: retenu !== null,
    avertissement,
    refus: verifierTaille((retenu ?? fichier).size, bucket),
  };
}

/** Libère les URL d'objet d'une file de fichiers. */
export function libererApercus(fichiers: readonly FichierPrepare[]): void {
  for (const prepare of fichiers) {
    if (prepare.apercu) URL.revokeObjectURL(prepare.apercu);
  }
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Interne
 * ═══════════════════════════════════════════════════════════════════════════ */

function verifierTaille(
  taille: number,
  bucket: keyof typeof MEDIA_MAX_BYTES,
): string | null {
  if (taille <= MEDIA_MAX_BYTES[bucket]) return null;

  const mo = Math.round(MEDIA_MAX_BYTES[bucket] / (1024 * 1024));
  return bucket === "media"
    ? `Cette image reste trop lourde après compression (${mo} Mo maximum).`
    : `Ce document est trop lourd (${mo} Mo maximum).`;
}

function chargerImage(url: string): Promise<HTMLImageElement> {
  return new Promise((resoudre, rejeter) => {
    const image = new Image();
    image.onload = () => resoudre(image);
    image.onerror = () => rejeter(new Error("Image illisible."));
    image.src = url;
  });
}

/**
 * Redessine l'image dans un canevas et la réencode en WebP.
 *
 * Renvoie `null` dès que quelque chose manque à l'appel — contexte 2D refusé,
 * `toBlob` sans résultat, encodeur WebP absent. Le fichier d'origine est alors
 * envoyé tel quel : plus lourd, mais intact. Une compression est un bonus, pas
 * une condition d'envoi.
 */
async function compresser(
  image: HTMLImageElement,
  origine: File,
): Promise<File | null> {
  const echelle = Math.min(1, LARGEUR_MAX / image.naturalWidth);
  const largeur = Math.round(image.naturalWidth * echelle);
  const hauteur = Math.round(image.naturalHeight * echelle);

  const canevas = document.createElement("canvas");
  canevas.width = largeur;
  canevas.height = hauteur;

  const contexte = canevas.getContext("2d");
  if (!contexte) return null;

  contexte.drawImage(image, 0, 0, largeur, hauteur);

  const blob = await new Promise<Blob | null>((resoudre) => {
    canevas.toBlob((resultat) => resoudre(resultat), "image/webp", QUALITE);
  });

  // Un navigateur sans encodeur WebP renvoie un PNG sans prévenir : le type
  // est vérifié plutôt que supposé.
  if (!blob || blob.type !== "image/webp") return null;

  return new File([blob], `${nomSansExtension(origine.name)}.webp`, {
    type: "image/webp",
    lastModified: Date.now(),
  });
}

function nomSansExtension(nom: string): string {
  const point = nom.lastIndexOf(".");
  return point > 0 ? nom.slice(0, point) : nom;
}
