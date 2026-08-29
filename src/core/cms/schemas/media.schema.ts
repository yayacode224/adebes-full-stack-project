import { z } from "zod";

import { MEDIA_KINDS, MEDIA_MAX_BYTES } from "../entities/media-asset";

/**
 * Schémas de validation de la médiathèque.
 *
 * Partagés client et serveur, comme `programme.schema.ts` : côté client c'est
 * du confort, côté serveur c'est la seule garantie — une Server Action est
 * joignable par un POST direct.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * Texte alternatif — le champ qui justifie tout le reste
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `media_assets.alt_text` est `not null` (migration 0004) parce que le site
 * respecte WCAG 1.1.1 et que le CMS ne doit pas permettre d'y régresser. Le
 * §7.2 du Rapport 2 est catégorique : « Le texte alternatif est EXIGÉ avant
 * l'enregistrement. Le bouton reste désactivé tant qu'il est vide. »
 *
 * Le minimum est à 3 caractères et non à 1 : « a » satisfait la contrainte de
 * la base sans décrire quoi que ce soit. Le message dit POURQUOI on le demande
 * — un utilisateur à qui l'on explique remplit le champ, un utilisateur à qui
 * l'on impose écrit « image ».
 */
export const altTextSchema = z
  .string()
  .trim()
  .min(
    3,
    "Décrivez ce que montre ce fichier : ce texte est lu à la place de l'image par les personnes qui ne la voient pas.",
  )
  .max(200, "Cette description est trop longue (200 caractères maximum).");

/**
 * Nom de dossier.
 *
 * Il est ASSAINI par `slugify` au moment de fabriquer le chemin de stockage
 * (écart nº 22) ; ce schéma ne fait que borner la saisie. Les deux points sont
 * refusés ici en plus, pour que l'utilisateur voie un message plutôt qu'un
 * dossier silencieusement renommé.
 */
export const folderSchema = z
  .string()
  .trim()
  .max(60, "Ce nom de dossier est trop long (60 caractères maximum).")
  .refine((valeur) => !valeur.includes(".."), {
    message: "Un nom de dossier ne peut pas contenir « .. ».",
  });

export const captionSchema = z
  .string()
  .trim()
  .max(300, "Cette légende est trop longue (300 caractères maximum).");

/* ═══════════════════════════════════════════════════════════════════════════
 * Téléversement
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Borne haute commune, égale à la plus grande des deux limites de bucket.
 *
 * La limite PRÉCISE dépend du bucket, et le bucket dépend du type réel du
 * fichier — qui n'est connu qu'après lecture des premiers octets, donc dans le
 * cas d'usage. Ce schéma pose donc la borne grossière, celle qui évite de
 * charger 200 Mo en mémoire avant de conclure ; le cas d'usage applique
 * ensuite la vraie (8 Mo pour une image, 20 Mo pour un PDF) avec son message.
 */
const TAILLE_MAX_ABSOLUE = Math.max(
  MEDIA_MAX_BYTES.media,
  MEDIA_MAX_BYTES.documents,
);

export const uploadMediaSchema = z.object({
  /**
   * `z.file()` (Zod 4) plutôt qu'un `instanceof` maison.
   *
   * Un `File` traverse la frontière d'une Server Action : React sait le
   * sérialiser. C'est ce qui permet de ne PAS passer par un Route Handler
   * d'upload, qu'il aurait fallu garder soi-même (décision D3 : aucune API
   * REST interne).
   */
  file: z
    .file()
    .min(1, "Ce fichier est vide.")
    .max(
      TAILLE_MAX_ABSOLUE,
      `Ce fichier est trop volumineux (${Math.round(TAILLE_MAX_ABSOLUE / (1024 * 1024))} Mo maximum).`,
    ),

  /**
   * Nom d'ORIGINE, tel que l'utilisateur l'a sur son poste.
   *
   * ---------------------------------------------------------------------------
   * POURQUOI IL EST TRANSMIS À PART, ET NON LU DANS `file.name`
   * ---------------------------------------------------------------------------
   * Défaut relevé par la recette navigateur du Lot 7. La compression client
   * réencode l'image en WebP et RECONSTRUIT un `File` : son `name` devient
   * « Photo campagne santé (1).webp ». Le catalogue affichait donc une
   * extension que l'utilisateur n'avait jamais vue, pour un fichier qu'il
   * croyait reconnaître.
   *
   * `media_assets.filename` est documenté comme « nom d'origine, conservé pour
   * l'affichage seulement » (migration 0004) : c'est bien le nom D'AVANT
   * compression qu'il doit porter. Le format réel, lui, est déjà dit par
   * `mime_type` et affiché à part dans la fiche.
   *
   * Facultatif : à défaut, le serveur retombe sur `file.name`. Cette valeur
   * n'entre dans aucune décision — ni le chemin de stockage, ni le type, ni la
   * taille n'en dépendent — et elle est assainie avant écriture.
   */
  filename: z
    .string()
    .trim()
    .min(1)
    .max(200, "Ce nom de fichier est trop long.")
    .optional(),

  altText: altTextSchema,
  caption: captionSchema.nullable().default(null),
  folder: folderSchema.nullable().default(null),

  /**
   * Dimensions MESURÉES PAR LE NAVIGATEUR avant l'envoi.
   *
   * ⚠️  Ce sont des métadonnées d'affichage, pas une garantie. Elles viennent
   * du client, donc elles ne sont pas dignes de confiance — et elles ne
   * servent à aucune décision : ni le bucket, ni la taille, ni le type n'en
   * dépendent. Elles alimentent la fiche de détail (« 1920 × 1080 ») et
   * l'avertissement « image un peu petite pour une couverture ».
   *
   * Les mesurer côté serveur exigerait de décoder l'image (une dépendance de
   * plus, du CPU par téléversement) pour un gain nul sur la sécurité.
   */
  width: z.number().int().positive().max(30000).nullable().default(null),
  height: z.number().int().positive().max(30000).nullable().default(null),
});

export type UploadMediaInput = z.infer<typeof uploadMediaSchema>;

/* ═══════════════════════════════════════════════════════════════════════════
 * Correction et suppression
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Ce qu'un administrateur corrige après coup.
 *
 * Ni `path`, ni `bucket`, ni `mimeType` : ces valeurs décrivent un fichier
 * déjà écrit dans le bucket. Les rendre modifiables permettrait au catalogue
 * de mentir sur le contenu réel du stockage.
 */
export const updateMediaSchema = z.object({
  id: z.uuid("Média introuvable."),
  altText: altTextSchema,
  caption: captionSchema.nullable().default(null),
  folder: folderSchema.nullable().default(null),
});

export type UpdateMediaInput = z.infer<typeof updateMediaSchema>;

/**
 * Le même contenu, SANS l'identifiant ni les valeurs par défaut — pour
 * `<SchemaForm>`.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI DEUX SCHÉMAS PLUTÔT QU'UN
 * ---------------------------------------------------------------------------
 * `<SchemaForm>` exige `z.ZodType<TValeurs, TValeurs>` — le type d'ENTRÉE et
 * celui de SORTIE doivent coïncider, `zodResolver` ne sachant pas travailler
 * autrement. Or `.default(null)` rend le champ facultatif en entrée et garanti
 * en sortie : les deux types divergent, et `updateMediaSchema` n'est donc pas
 * utilisable tel quel dans un formulaire.
 *
 * L'identifiant, lui, n'a rien à faire dans un formulaire : il identifie la
 * cible, il ne se saisit pas (même raisonnement que l'écart nº 20 sur
 * `updateProgramme`).
 *
 * Les deux schémas partagent leurs briques (`altTextSchema`, `captionSchema`,
 * `folderSchema`) : les règles ne peuvent pas diverger, seule leur enveloppe
 * change.
 */
export const mediaFicheSchema = z.object({
  altText: altTextSchema,
  caption: captionSchema.nullable(),
  folder: folderSchema.nullable(),
});

export type MediaFicheInput = z.infer<typeof mediaFicheSchema>;

export const mediaIdSchema = z.object({
  id: z.uuid("Média introuvable."),
});

/**
 * Plusieurs médias d'un coup.
 *
 * Ajouté au Lot 8A pour le champ `galleryMediaIds` : résoudre vingt-quatre
 * vignettes avec `mediaIdSchema` demanderait vingt-quatre allers-retours, sur
 * une connexion mobile, à chaque ouverture du formulaire.
 */
export const mediaIdsSchema = z.object({
  ids: z.array(z.uuid("Média introuvable.")).max(100),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Lecture
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Filtre de la liste.
 *
 * Validé comme le reste : il arrive d'une Server Action, donc d'une frontière
 * publique. `pageSize` est borné une seconde fois par `normalizeFilter`.
 */
export const mediaFilterSchema = z.object({
  search: z.string().trim().max(120).optional(),
  kind: z.enum(MEDIA_KINDS).optional(),
  folder: z.string().trim().max(60).optional(),
  page: z.number().int().min(1).optional(),
  pageSize: z.number().int().min(1).max(100).optional(),
});

export type MediaFilterInput = z.infer<typeof mediaFilterSchema>;
