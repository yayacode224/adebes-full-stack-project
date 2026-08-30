import { z } from "zod";

import { CONTENT_STATUSES } from "../entities/content-status";
import { MEDIA_TONES } from "../entities/media-tone";
import { slugSchema } from "./programme.schema";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION DE LA GALERIE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagés client et serveur, comme aux Lots 8A à 8G : la validation côté
 * client améliore le confort, celle côté serveur est la seule qui protège —
 * une Server Action est joignable par un POST direct, sans passer par le
 * formulaire.
 *
 * ---------------------------------------------------------------------------
 * LES MESSAGES FRANÇAIS SONT ÉCRITS AUX TROIS NIVEAUX — écarts nº 90 et nº 99
 * ---------------------------------------------------------------------------
 *   1. **Type** — `z.string("…")`, `z.uuid("…")`. Sans lui, un champ ABSENT de
 *      la charge utile produit « Invalid input: expected string, received
 *      undefined ».
 *   2. **Forme** — `.min()`, `.max()`, `.refine()`. Zod s'arrête au premier
 *      échec : il faut les deux.
 *   3. **Objet** — le `{ message: "…" }` en second argument de chaque
 *      `z.object`. Sans lui, `safeParse(null)` produit « Invalid input:
 *      expected object, received null », en anglais, et aucun champ n'est en
 *      cause.
 *
 * C'est le quatrième lot consécutif à l'appliquer dès la première version
 * (8D, 8E, 8F, 8G). Le trou reste ouvert dans `programme.schema.ts`,
 * `article.schema.ts` et `testimonial.schema.ts` — Lot 16.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE `slugSchema` SUR L'ÉLÉMENT — MAIS UN SUR LA CATÉGORIE
 * ---------------------------------------------------------------------------
 * Une photo de galerie n'a pas d'adresse : il n'existe aucune page
 * `/galerie/<slug>`, ni dans le site actuel, ni dans les 17 lots. La
 * visionneuse est une modale, pas une route.
 *
 * `gallery_categories.slug`, lui, existe en base (`text not null unique`) et
 * sert au rapprochement avec le seed — exactement comme
 * `article_categories.slug` au Lot 8B.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * L'élément de galerie
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * L'identifiant du média.
 *
 * ⚠️  `not null` en base, et le schéma le dit AVANT la base : sans photo il n'y
 * a pas d'élément de galerie. C'est la seule référence de média obligatoire du
 * projet — partout ailleurs (`cover_media_id`, `photo_media_id`) l'absence est
 * un état normal, rendu par `MediaPlaceholder`.
 *
 * Le message ne parle donc pas d'« identifiant » mais de photo : c'est ce que
 * l'utilisateur a sous les yeux, et il n'écrira jamais d'UUID.
 */
const mediaObligatoireSchema = z.uuid(
  "Choisissez une photo dans la médiathèque : un élément de galerie ne peut pas exister sans image.",
);

/**
 * L'identifiant de la catégorie — ou son absence.
 *
 * `null` est une valeur, pas un manque : la colonne est nullable (migration
 * 0005) et un élément non classé est un état légitime. Voir
 * `apparaitDansUnFiltre()` dans l'entité pour ce que cela implique côté site.
 */
const categorieFacultativeSchema = z
  .uuid("Catégorie inconnue.")
  .nullable();

export const galleryItemSchema = z.object(
  {
    id: z.uuid("Identifiant d'élément de galerie invalide."),
    mediaId: mediaObligatoireSchema,
    categoryId: categorieFacultativeSchema,
    position: z.number("Position invalide.").int().min(0),
    status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
    createdAt: z.string("Date de création invalide."),
    updatedAt: z.string("Date de modification invalide."),
  },
  { message: "Élément de galerie invalide." },
);

/**
 * Création.
 *
 * ⚠️  `status` EST ABSENT, comme aux Lots 8C, 8D et 8F.
 *
 * Aux Lots 8A et 8B il restait facultatif : un `status: 'published'` envoyé par
 * un POST direct était arrêté plus loin par le trigger `guard_publish` (ADB01).
 * Cette porte donnerait ici à un ADMINISTRATEUR — qui, lui, passe le trigger —
 * le moyen de mettre une photo en ligne sans jamais traverser
 * `setGalleryItemStatus`.
 *
 * `position` reste facultatif : elle est calculée, pas décidée.
 *
 * `categoryId` porte un `.default(null)` : créer une photo sans l'avoir classée
 * est le cas courant — on téléverse d'abord, on range ensuite.
 */
export const createGalleryItemSchema = galleryItemSchema
  .omit({ id: true, createdAt: true, updatedAt: true, status: true })
  .extend({
    position: z.number("Position invalide.").int().min(0).optional(),
    categoryId: categorieFacultativeSchema.default(null),
  });

/** Modification partielle : seuls les champs envoyés sont validés. */
export const updateGalleryItemSchema = galleryItemSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ id: z.uuid("Identifiant d'élément de galerie invalide.") });

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SCHÉMA DU FORMULAIRE — distinct des deux précédents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Huitième collection, même contrainte (écarts nº 50, 58, 71, 86, et ceux des
 * Lots 8E à 8G) : `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE
 * identique au type de SORTIE. `createGalleryItemSchema` porte un `.default()`
 * et un `.optional()`, `updateGalleryItemSchema` est `.partial()` : les deux
 * ont entrée ≠ sortie.
 *
 * ---------------------------------------------------------------------------
 * `categoryId` EST UNE CHAÎNE ICI, PAS UN `uuid | null` — écart nº 71 qui se
 * rejoue
 * ---------------------------------------------------------------------------
 * Radix refuse `<SelectItem value="">` — la chaîne vide est réservée à
 * « aucune sélection » et lève une erreur à l'exécution. L'option « Sans
 * catégorie » porte donc la sentinelle ci-dessous, et le formulaire la
 * retraduit en `null` au moment de l'envoi. La conversion vit dans le
 * composant, pas dans le schéma : un schéma qui transforme aurait entrée ≠
 * sortie, ce que `<SchemaForm>` refuse.
 *
 * `mediaId`, lui, garde le MÊME schéma que les deux autres : le champ `media`
 * porte `null` quand rien n'est choisi, et `z.uuid()` le refuse avec le message
 * qui parle de photo. C'est ce qui rend la règle « pas d'élément sans image »
 * visible dans le formulaire plutôt qu'au retour du serveur.
 */
export const SANS_CATEGORIE = "aucune";

export const galleryItemFormSchema = z.object(
  {
    mediaId: mediaObligatoireSchema,
    /** Un identifiant de catégorie, ou la sentinelle `SANS_CATEGORIE`. */
    categoryId: z
      .string("Choisissez une catégorie, ou « Sans catégorie ».")
      .min(1, "Choisissez une catégorie, ou « Sans catégorie »."),
  },
  { message: "Formulaire invalide." },
);

/** Désigne un élément — suppression, publication, lecture d'une fiche. */
export const galleryItemIdSchema = z.object(
  { id: z.uuid("Identifiant d'élément de galerie invalide.") },
  { message: "Identifiant d'élément de galerie invalide." },
);

/** Changement d'état éditorial — publication, dépublication, archivage. */
export const setGalleryItemStatusSchema = z.object(
  {
    id: z.uuid("Identifiant d'élément de galerie invalide."),
    status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
  },
  { message: "Changement d’état invalide." },
);

/**
 * Réordonnancement.
 *
 * La liste est ENTIÈRE et dans le nouvel ordre — le cas d'usage refuse une
 * liste partielle. Ce schéma ne vérifie que la forme.
 */
export const reorderGalleryItemsSchema = z.object(
  {
    orderedIds: z
      .array(z.uuid("Identifiant d'élément de galerie invalide."), {
        message: "La liste des éléments à réordonner est absente.",
      })
      .min(1, "Aucun élément à réordonner."),
  },
  { message: "Liste de réordonnancement invalide." },
);

/* ═══════════════════════════════════════════════════════════════════════════
 * Les catégories
 * ═══════════════════════════════════════════════════════════════════════════ */

const libelleCategorieSchema = z
  .string("Le nom de la catégorie est obligatoire.")
  .trim()
  .min(2, "Le nom de la catégorie est obligatoire (2 caractères minimum).")
  .max(40, "Ce nom est trop long (40 caractères maximum).");

/**
 * La teinte.
 *
 * ⚠️  Un `z.enum`, et la base le dit aussi : `gallery_categories.tone` est un
 * `public.media_tone` (énuméré PostgreSQL, migration 0001), pas un `text`. Il y
 * a donc DEUX barrières indépendantes, comme pour `faq_items.topic` au Lot 8F
 * (écart nº 116) — et contrairement à `core_values.icon`, colonne `text` libre
 * où le schéma est la seule barrière (écart nº 102).
 *
 * Le schéma reste indispensable : sans lui, une teinte invalide traverserait
 * toute la chaîne pour échouer sur « invalid input value for enum media_tone »,
 * message exact, illisible, et affiché à quelqu'un qui n'écrira jamais de SQL.
 */
const teinteSchema = z.enum(MEDIA_TONES, {
  message: "Choisissez une teinte parmi celles proposées.",
});

export const createGalleryCategorySchema = z.object(
  {
    label: libelleCategorieSchema,
    slug: slugSchema.optional(),
    tone: teinteSchema.optional(),
  },
  { message: "Catégorie invalide." },
);

/**
 * Renommage — et changement de teinte.
 *
 * Le Lot 8B ne transportait qu'un `label` : `article_categories` n'a pas de
 * colonne `tone`. Ici la teinte est modifiable, parce qu'elle est visible sur
 * le site (le fond du `MediaPlaceholder`) et qu'aucun autre écran ne permet de
 * la corriger.
 *
 * ⚠️  L'ADRESSE N'EST PAS RECALCULÉE au renommage — voir le cas d'usage.
 */
export const updateGalleryCategorySchema = z.object(
  {
    id: z.uuid("Identifiant de catégorie invalide."),
    label: libelleCategorieSchema,
    tone: teinteSchema.optional(),
  },
  { message: "Catégorie invalide." },
);

export const galleryCategoryIdSchema = z.object(
  { id: z.uuid("Identifiant de catégorie invalide.") },
  { message: "Identifiant de catégorie invalide." },
);

/**
 * Réordonnancement des catégories.
 *
 * L'ordre des boutons de filtre de `/galerie`, exactement comme
 * `article_categories` fixe celui de `/actualites`.
 */
export const reorderGalleryCategoriesSchema = z.object(
  {
    orderedIds: z
      .array(z.uuid("Identifiant de catégorie invalide."), {
        message: "La liste des catégories à réordonner est absente.",
      })
      .min(1, "Aucun élément à réordonner."),
  },
  { message: "Liste de réordonnancement invalide." },
);

export type GalleryItemInput = z.infer<typeof galleryItemSchema>;
export type CreateGalleryItemInput = z.infer<typeof createGalleryItemSchema>;
export type UpdateGalleryItemInput = z.infer<typeof updateGalleryItemSchema>;
export type GalleryItemFormInput = z.infer<typeof galleryItemFormSchema>;
