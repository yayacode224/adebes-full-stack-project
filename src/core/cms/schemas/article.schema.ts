import { z } from "zod";

import { CONTENT_STATUSES } from "../entities/content-status";
import { slugSchema } from "./programme.schema";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION DE L'ACTUALITÉ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagés client et serveur, comme au Lot 8A : la validation côté client
 * améliore le confort, celle côté serveur est la seule qui protège — une
 * Server Action est joignable par un POST direct, sans passer par le
 * formulaire.
 *
 * `slugSchema` est importé de `programme.schema.ts`, qui le déclare comme
 * « réutilisé par toutes les entités à adresse : programmes, articles,
 * pages ». Le dupliquer aurait laissé les deux règles diverger — et une
 * adresse d'article acceptée ici mais refusée ailleurs est exactement le genre
 * d'incohérence qu'un utilisateur ne peut pas s'expliquer.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * La date de publication
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Un instant, au format ISO 8601.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI `Date.parse` ET NON `z.iso.datetime()`
 * ---------------------------------------------------------------------------
 * PostgreSQL renvoie ses `timestamptz` sous des formes que le validateur strict
 * refuse — « 2025-08-20T08:00:00+00:00 » avec décalage explicite, parfois avec
 * une précision à la microseconde. Un schéma qui refuserait la donnée que la
 * base vient de rendre est un schéma qui casse la modification d'un article
 * existant sans que personne comprenne pourquoi.
 *
 * On vérifie donc ce qui compte réellement : que la chaîne désigne un instant.
 *
 * ⚠️  AUCUNE BORNE DE DATE. Le §8B l'exige explicitement : la date doit être
 * saisissable dans le PASSÉ (reprise d'articles anciens) comme dans le FUTUR
 * (publication programmée, Lot 12). Refuser le futur ici rendrait la
 * fonctionnalité annoncée impossible.
 */
export const dateISOSchema = z
  .string()
  .trim()
  .min(1, "La date est obligatoire.")
  .refine((valeur) => !Number.isNaN(Date.parse(valeur)), {
    message: "Cette date n'est pas valide.",
  });

/* ═══════════════════════════════════════════════════════════════════════════
 * L'article
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Le corps : un paragraphe par entrée, comme le produit le champ `richtext`. */
const corpsSchema = z
  .array(
    z
      .string()
      .trim()
      .min(1, "Ce paragraphe est vide : renseignez-le ou supprimez-le."),
  )
  .min(1, "Écrivez au moins un paragraphe.")
  .max(200, "Cet article est trop long (200 paragraphes maximum).");

export const articleSchema = z.object({
  id: z.uuid(),
  slug: slugSchema,
  title: z
    .string()
    .trim()
    .min(3, "Le titre est obligatoire (3 caractères minimum).")
    .max(160, "Le titre est trop long (160 caractères maximum)."),
  excerpt: z
    .string()
    .trim()
    .min(10, "Le chapô est obligatoire (10 caractères minimum).")
    .max(300, "Le chapô est trop long (300 caractères maximum)."),
  body: corpsSchema,
  categoryId: z.uuid("Cette catégorie n'existe pas.").nullable(),
  coverMediaId: z.uuid().nullable(),
  readingMinutes: z
    .number()
    .int("Indiquez un nombre entier de minutes.")
    .min(1, "Le temps de lecture est d'au moins 1 minute.")
    .max(240, "Ce temps de lecture est invraisemblable (240 minutes maximum).")
    .nullable(),
  isPlaceholder: z.boolean(),
  publishedAt: dateISOSchema.nullable(),
  status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
  authorId: z.uuid().nullable(),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Création.
 *
 * `slug` est facultatif : il est proposé à partir du titre par le cas d'usage.
 * `readingMinutes` l'est aussi — le cas d'usage le CALCULE à 200 mots/min
 * quand le formulaire ne l'a pas fourni (§8B).
 *
 * `authorId` n'est PAS saisissable : il vient de la session, jamais de la
 * charge utile. Un champ qui désigne l'auteur et qu'on peut remplir soi-même
 * ne désigne rien.
 */
export const createArticleSchema = articleSchema
  .omit({ id: true, createdAt: true, updatedAt: true, authorId: true })
  .extend({
    slug: slugSchema.optional(),
    status: z.enum(CONTENT_STATUSES).optional(),
    categoryId: z.uuid().nullable().default(null),
    coverMediaId: z.uuid().nullable().default(null),
    readingMinutes: z.number().int().min(1).max(240).nullable().default(null),
    isPlaceholder: z.boolean().default(false),
    publishedAt: dateISOSchema.nullable().default(null),
  });

/** Modification partielle : seuls les champs envoyés sont validés. */
export const updateArticleSchema = articleSchema
  .omit({ id: true, createdAt: true, updatedAt: true, authorId: true })
  .partial()
  .extend({ id: z.uuid() });

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SCHÉMA DU FORMULAIRE — distinct des deux précédents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Troisième schéma, pour la même raison qu'aux écarts nº 50 et nº 58 :
 * `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE identique au type de
 * SORTIE. `createArticleSchema` porte cinq `.default(...)` et
 * `updateArticleSchema` est `.partial()` : les deux ont entrée ≠ sortie.
 *
 * Les trois partagent leurs briques (`slugSchema`, `corpsSchema`,
 * `dateISOSchema`) : les règles ne peuvent pas diverger, seule l'enveloppe
 * change.
 *
 * ---------------------------------------------------------------------------
 * `categoryId` EST UNE CHAÎNE ICI, PAS UN `uuid | null`
 * ---------------------------------------------------------------------------
 * Radix refuse `<SelectItem value="">` — la chaîne vide est réservée à
 * « aucune sélection » et lève une erreur à l'exécution. L'option « Sans
 * catégorie » porte donc la sentinelle `SANS_CATEGORIE`, et le formulaire la
 * retraduit en `null` au moment de l'envoi. La conversion vit dans le
 * composant, pas dans le schéma : un schéma qui transforme aurait entrée ≠
 * sortie, ce que `<SchemaForm>` refuse — le serpent se mordrait la queue.
 */
export const SANS_CATEGORIE = "aucune";

export const articleFormSchema = z.object({
  title: articleSchema.shape.title,
  slug: slugSchema,
  excerpt: articleSchema.shape.excerpt,
  body: corpsSchema,
  /** Un identifiant de catégorie, ou la sentinelle `SANS_CATEGORIE`. */
  categoryId: z.string().min(1, "Choisissez une catégorie."),
  coverMediaId: z.uuid().nullable(),
  publishedAt: dateISOSchema.nullable(),
  readingMinutes: articleSchema.shape.readingMinutes,
  isPlaceholder: z.boolean(),
});

/** Désigne un article — suppression, publication, lecture d'une fiche. */
export const articleIdSchema = z.object({
  id: z.uuid("Identifiant d'article invalide."),
});

/** Changement d'état éditorial — publication, dépublication, archivage. */
export const setArticleStatusSchema = z.object({
  id: z.uuid("Identifiant d'article invalide."),
  status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Les catégories
 * ═══════════════════════════════════════════════════════════════════════════ */

const libelleCategorieSchema = z
  .string()
  .trim()
  .min(2, "Le nom de la catégorie est obligatoire (2 caractères minimum).")
  .max(40, "Ce nom est trop long (40 caractères maximum).");

export const createArticleCategorySchema = z.object({
  label: libelleCategorieSchema,
  slug: slugSchema.optional(),
});

export const updateArticleCategorySchema = z.object({
  id: z.uuid("Identifiant de catégorie invalide."),
  label: libelleCategorieSchema,
});

export const articleCategoryIdSchema = z.object({
  id: z.uuid("Identifiant de catégorie invalide."),
});

/**
 * Réordonnancement des catégories.
 *
 * ⚠️  C'est ICI que vit le réordonnancement du Lot 8B, et non sur les
 * articles : `articles` n'a pas de colonne `position` (migration 0005), un fil
 * d'actualités s'ordonnant par date. `article_categories`, elle, en a une —
 * c'est elle qui fixe l'ordre des boutons de filtre sur `/actualites`.
 */
export const reorderArticleCategoriesSchema = z.object({
  orderedIds: z.array(z.uuid()).min(1, "Aucun élément à réordonner."),
});

export type ArticleInput = z.infer<typeof articleSchema>;
export type CreateArticleInput = z.infer<typeof createArticleSchema>;
export type UpdateArticleInput = z.infer<typeof updateArticleSchema>;
export type ArticleFormInput = z.infer<typeof articleFormSchema>;
