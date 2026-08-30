import { z } from "zod";

import { CONTENT_STATUSES } from "../entities/content-status";
import { FAQ_TOPICS } from "../entities/faq-item";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION D'UNE QUESTION FRÉQUENTE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagés client et serveur, comme aux Lots 8A à 8E : la validation côté
 * client améliore le confort, celle côté serveur est la seule qui protège —
 * une Server Action est joignable par un POST direct, sans passer par le
 * formulaire.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `slugSchema`, COMME AUX LOTS 8C, 8D ET 8E
 * ---------------------------------------------------------------------------
 * Une question n'a pas d'adresse : il n'existe aucune page `/faq/<slug>`, ni
 * dans le site actuel, ni dans les 17 lots. Elle s'affiche dans l'accordéon de
 * l'accueil, de « Faire un don » ou de « Devenir bénévole », selon son sujet.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LES MESSAGES FRANÇAIS SONT ÉCRITS AUX TROIS NIVEAUX DÈS LA PREMIÈRE
 *     VERSION — écarts nº 90 et nº 99
 * ---------------------------------------------------------------------------
 *   1. **Type** — `z.string("…")`. Sans lui, un champ ABSENT de la charge
 *      utile produit « Invalid input: expected string, received undefined ».
 *   2. **Longueur / forme** — `.min(n, "…")`, `.max(n, "…")`. Zod s'arrête au
 *      premier échec : il faut les deux.
 *   3. **Objet** — le `{ message: "…" }` en second argument de chaque
 *      `z.object`. Sans lui, `safeParse("bonjour")` ou `safeParse(null)`
 *      produit « Invalid input: expected object, received string », en
 *      anglais, et aucun champ n'est en cause.
 *
 * Le troisième niveau se propage aux schémas dérivés (`.omit()`, `.extend()`,
 * `.partial()`), ce que la recette vérifie sur les sept schémas de ce fichier.
 *
 * ⚠️  Le trou existe encore dans `programme.schema.ts`, `article.schema.ts` et
 * `testimonial.schema.ts`. Il est consigné pour le Lot 16 : corriger le schéma
 * d'un lot livré sans rejouer sa recette ne prouverait rien.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `topic` EST UN `z.enum`, ET LA BASE LE DIT AUSSI
 * ---------------------------------------------------------------------------
 * C'est la différence avec `icon` au Lot 8E (écart nº 102) : la colonne porte
 * `check (topic in ('don', 'benevolat', 'general'))` (migration 0005). Il y a
 * donc deux barrières indépendantes, et non une seule.
 *
 * Le schéma reste indispensable malgré la contrainte SQL : c'est lui qui
 * produit un message en français sous le bon champ. Sans lui, un sujet
 * invalide traverserait toute la chaîne pour échouer sur
 * « new row for relation "faq_items" violates check constraint
 * "faq_items_topic_check" » — exact, illisible, et affiché à quelqu'un qui
 * n'écrira jamais de SQL.
 */

/**
 * Les puces de la réponse.
 *
 * ⚠️  Facultatives — c'est la première liste du projet dans ce cas.
 *
 * Les quatre listes du Lot 8A (`actions`, `publics`, `besoins`) portent
 * `.min(1)` : un programme sans action n'est pas un programme. Ici, cinq des
 * sept questions du site n'ont AUCUNE puce et se lisent parfaitement. Exiger
 * au moins une ligne obligerait à en inventer une — invariant nº 1 — ou à
 * couper la réponse en deux pour satisfaire le formulaire.
 *
 * La borne haute et la longueur de ligne, elles, sont reprises telles quelles
 * de `listeDeTextes` (Lot 8A) : au-delà, ce n'est plus une réponse mais une
 * page.
 */
const pucesSchema = z
  .array(
    z
      .string("Cette ligne doit être du texte.")
      .trim()
      .min(1, "Cette ligne est vide : renseignez-la ou supprimez-la.")
      .max(200, "Cette ligne est trop longue (200 caractères maximum)."),
    { message: "Les puces doivent être une liste de lignes." },
  )
  .max(12, "Pas plus de 12 puces : au-delà, la réponse devient une page.");

export const faqItemSchema = z.object(
  {
    id: z.uuid("Identifiant de question invalide."),
    question: z
      .string("La question est obligatoire.")
      .trim()
      .min(10, "La question est obligatoire (10 caractères minimum).")
      .max(200, "Cette question est trop longue (200 caractères maximum)."),
    answer: z
      .string("La réponse est obligatoire.")
      .trim()
      .min(20, "La réponse est obligatoire (20 caractères minimum).")
      .max(2000, "Cette réponse est trop longue (2000 caractères maximum)."),
    bullets: pucesSchema,
    topic: z.enum(FAQ_TOPICS, {
      message: "Choisissez un sujet : dons, bénévolat ou général.",
    }),
    position: z.number("Position invalide.").int().min(0),
    status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
    createdAt: z.string("Date de création invalide."),
    updatedAt: z.string("Date de modification invalide."),
  },
  { message: "Question fréquente invalide." },
);

/**
 * Création.
 *
 * ⚠️  `status` EST ABSENT DE CE SCHÉMA, comme aux Lots 8C et 8D.
 *
 * Aux Lots 8A et 8B, `status` restait facultatif : un `status: 'published'`
 * envoyé par un POST direct était arrêté plus loin par le trigger
 * `guard_publish` (ADB01). Cette porte donnerait ici à un administrateur — qui,
 * lui, passe le trigger — le moyen de créer une question DÉJÀ EN LIGNE, donc
 * déjà déclarée aux moteurs de recherche, sans jamais traverser
 * `setFaqItemStatus`.
 *
 * `position` reste facultatif : il est calculé, pas décidé.
 *
 * `bullets` porte un `.default([])` : une question sans puces est le cas
 * normal, et l'omettre ne doit pas être une erreur de saisie.
 */
export const createFaqItemSchema = faqItemSchema
  .omit({ id: true, createdAt: true, updatedAt: true, status: true })
  .extend({
    position: z.number("Position invalide.").int().min(0).optional(),
    bullets: pucesSchema.default([]),
  });

/** Modification partielle : seuls les champs envoyés sont validés. */
export const updateFaqItemSchema = faqItemSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ id: z.uuid("Identifiant de question invalide.") });

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SCHÉMA DU FORMULAIRE — distinct des deux précédents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Sixième collection, même contrainte (écarts nº 50, 58, 71, 86 et celui du
 * Lot 8E) : `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE identique au
 * type de SORTIE. `createFaqItemSchema` porte deux `.default(...)` / `.optional()`
 * et `updateFaqItemSchema` est `.partial()` : les deux ont entrée ≠ sortie.
 *
 * Les trois schémas partagent leurs briques (`pucesSchema`, et les champs de
 * `faqItemSchema.shape`) : les règles ne peuvent pas diverger, seule
 * l'enveloppe change.
 */
export const faqItemFormSchema = z.object(
  {
    question: faqItemSchema.shape.question,
    answer: faqItemSchema.shape.answer,
    topic: faqItemSchema.shape.topic,
    bullets: pucesSchema,
  },
  { message: "Formulaire invalide." },
);

/** Désigne une question — suppression, publication, lecture d'une fiche. */
export const faqItemIdSchema = z.object(
  { id: z.uuid("Identifiant de question invalide.") },
  { message: "Identifiant de question invalide." },
);

/** Changement d'état éditorial — publication, dépublication, archivage. */
export const setFaqItemStatusSchema = z.object(
  {
    id: z.uuid("Identifiant de question invalide."),
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
export const reorderFaqItemsSchema = z.object(
  {
    orderedIds: z
      .array(z.uuid("Identifiant de question invalide."), {
        message: "La liste des questions à réordonner est absente.",
      })
      .min(1, "Aucun élément à réordonner."),
  },
  { message: "Liste de réordonnancement invalide." },
);

export type FaqItemInput = z.infer<typeof faqItemSchema>;
export type CreateFaqItemInput = z.infer<typeof createFaqItemSchema>;
export type UpdateFaqItemInput = z.infer<typeof updateFaqItemSchema>;
export type FaqItemFormInput = z.infer<typeof faqItemFormSchema>;
