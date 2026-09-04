import { z } from "zod";

import { BLOCK_TYPES } from "../entities/block-type";
import { CONTENT_STATUSES } from "../entities/content-status";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION DES PAGES ET DES SECTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagés client et serveur, comme aux Lots 8A à 8I. La validation côté client
 * améliore le confort ; celle du serveur est la seule qui protège.
 *
 * ⚠️  Le contenu d'une section n'est **pas** validé ici. Il l'est par le schéma
 * du bloc concerné, via `parseContenu()` du registre : dix-sept formes
 * différentes ne se valident pas par un schéma unique. Ce fichier ne vérifie
 * que l'ENVELOPPE — quelle page, quel bloc, quelle position.
 */

/* ────────────────────────────────── Page ────────────────────────────────── */

/**
 * Le chemin servi.
 *
 * ⚠️  Trois règles, et chacune a coûté quelque chose ailleurs :
 *
 *   1. **commence par `/`** — sans quoi `route` ne se compare pas au
 *      `pathname` du rendu public, et la page n'est jamais trouvée ;
 *   2. **pas de barre finale** (sauf la racine `/`) — `/a-propos/` et
 *      `/a-propos` seraient deux lignes distinctes pour une seule page servie ;
 *   3. **caractères d'URL uniquement** — un accent dans une route produit une
 *      adresse encodée illisible et impossible à dicter au téléphone.
 */
const routeSchema = z
  .string("L'adresse est obligatoire.")
  .trim()
  .min(1, "L'adresse est obligatoire.")
  .max(120, "Cette adresse est trop longue (120 caractères maximum).")
  .refine((valeur) => valeur.startsWith("/"), {
    message: "L'adresse doit commencer par une barre oblique : /ma-page.",
  })
  .refine((valeur) => valeur === "/" || !valeur.endsWith("/"), {
    message: "L'adresse ne doit pas se terminer par une barre oblique.",
  })
  .refine((valeur) => /^\/[a-z0-9\-/]*$/.test(valeur), {
    message:
      "L'adresse ne peut contenir que des minuscules non accentuées, des chiffres et des tirets.",
  });

const slugSchema = z
  .string("L'identifiant est obligatoire.")
  .trim()
  .min(1, "L'identifiant est obligatoire.")
  .max(80, "Cet identifiant est trop long (80 caractères maximum).")
  .regex(
    /^[a-z0-9]+(?:-[a-z0-9]+)*$/,
    "L'identifiant ne peut contenir que des minuscules non accentuées, des chiffres et des tirets.",
  );

export const pageSchema = z.object(
  {
    id: z.uuid("Identifiant de page invalide."),
    slug: slugSchema,
    route: routeSchema,
    title: z
      .string("Le titre est obligatoire.")
      .trim()
      .min(2, "Le titre est obligatoire.")
      .max(120, "Ce titre est trop long (120 caractères maximum)."),
    status: z.enum(CONTENT_STATUSES, { message: "Statut de page invalide." }),
    isSystem: z.boolean("Indicateur de page système invalide."),
    /*
      Les trois champs de référencement sont NULLABLES et non « vides » : la
      distinction porte du sens ici, à l'inverse des champs de bloc.

      `metaTitle` à `null` signifie « employer le titre de la page » ; une
      chaîne vide signifierait « une balise <title> vide », ce qu'aucun éditeur
      ne veut et qu'aucun moteur de recherche ne pardonne. Le formulaire écrit
      `null` quand le champ est laissé vide.
    */
    metaTitle: z
      .string("Le titre de référencement doit être du texte.")
      .trim()
      .max(70, "Ce titre dépasse 70 caractères : il sera tronqué dans Google.")
      .nullable(),
    metaDescription: z
      .string("La description doit être du texte.")
      .trim()
      .max(
        180,
        "Cette description dépasse 180 caractères : elle sera tronquée dans Google.",
      )
      .nullable(),
    ogMediaId: z.uuid("Image de partage invalide.").nullable(),
    publishedAt: z.string("Date de publication invalide.").nullable(),
    createdAt: z.string("Date de création invalide."),
    updatedAt: z.string("Date de modification invalide."),
  },
  { message: "Page invalide." },
);

/**
 * Création.
 *
 * ⚠️  Ni `status` ni `isSystem` — voir `CreatePage` dans l'entité. Une page ne
 * peut naître ni publiée, ni système.
 */
export const createPageSchema = z.object(
  {
    title: pageSchema.shape.title,
    slug: slugSchema.optional(),
    route: routeSchema.optional(),
    metaTitle: pageSchema.shape.metaTitle.optional(),
    metaDescription: pageSchema.shape.metaDescription.optional(),
    ogMediaId: pageSchema.shape.ogMediaId.optional(),
  },
  { message: "Création de page invalide." },
);

/**
 * Le schéma du FORMULAIRE de création — distinct de `createPageSchema`.
 *
 * Même raison que `pageFormSchema` plus bas : `<SchemaForm>` exige
 * `z.ZodType<T, T>`, et `createPageSchema` porte des `.optional()`.
 *
 * ⚠️  `route` Y EST DÉLIBÉRÉMENT PERMISSIF — une chaîne vide y est valide,
 * alors que `routeSchema` la refuse (elle exige `min(1)` et un `/` initial).
 * Une adresse vide, dans CE formulaire, signifie « déduisez-la du titre » —
 * c'est `createPage()` qui portera la déduction, et c'est lui qui validera le
 * résultat final (dérivé ou saisi) avec la vraie forme de `routeSchema`. Le
 * client ne fait ici que vérifier la longueur ; le serveur reste la seule
 * barrière qui compte.
 */
export const createPageFormSchema = z.object(
  {
    title: pageSchema.shape.title,
    route: z
      .string("L'adresse doit être du texte.")
      .trim()
      .max(120, "Cette adresse est trop longue (120 caractères maximum)."),
  },
  { message: "Formulaire de création invalide." },
);

export type CreatePageFormInput = z.infer<typeof createPageFormSchema>;

export const updatePageSchema = z.object(
  {
    id: z.uuid("Identifiant de page invalide."),
    title: pageSchema.shape.title.optional(),
    slug: slugSchema.optional(),
    route: routeSchema.optional(),
    metaTitle: pageSchema.shape.metaTitle.optional(),
    metaDescription: pageSchema.shape.metaDescription.optional(),
    ogMediaId: pageSchema.shape.ogMediaId.optional(),
  },
  { message: "Modification de page invalide." },
);

/**
 * Le schéma du FORMULAIRE de réglages de page — distinct des deux précédents.
 *
 * Même raison qu'aux neuf lots de la série 8 : `<SchemaForm>` exige
 * `z.ZodType<T, T>`, et les deux schémas ci-dessus portent des `.optional()`.
 *
 * ⚠️  `status` n'y figure pas. Publier n'est pas de la saisie : c'est une
 * décision, prise depuis la barre d'action de l'éditeur, avec sa permission
 * (`page:publish`), sa garde de contenu et son entrée d'audit.
 */
export const pageFormSchema = z.object(
  {
    title: pageSchema.shape.title,
    route: routeSchema,
    metaTitle: pageSchema.shape.metaTitle,
    metaDescription: pageSchema.shape.metaDescription,
    ogMediaId: pageSchema.shape.ogMediaId,
  },
  { message: "Formulaire de page invalide." },
);

export const pageIdSchema = z.object(
  { id: z.uuid("Identifiant de page invalide.") },
  { message: "Identifiant de page invalide." },
);

export const setPageStatusSchema = z.object(
  {
    id: z.uuid("Identifiant de page invalide."),
    status: z.enum(CONTENT_STATUSES, { message: "Statut de page invalide." }),
  },
  { message: "Changement de statut invalide." },
);

/* ──────────────────────────────── Sections ──────────────────────────────── */

export const addSectionSchema = z.object(
  {
    pageId: z.uuid("Identifiant de page invalide."),
    blockType: z.enum(BLOCK_TYPES, { message: "Choisissez un type de bloc." }),
    /**
     * Position d'insertion, `null` pour ajouter en fin de liste.
     *
     * Le sélecteur de blocs s'ouvre depuis un bouton « + » placé ENTRE deux
     * sections aussi bien qu'en bas de l'arbre. Sans cette valeur, ajouter au
     * milieu aurait demandé un ajout suivi d'un réordonnancement — deux
     * écritures, deux entrées d'audit, et un état intermédiaire visible sur le
     * site si la seconde échoue.
     */
    position: z
      .number("Position invalide.")
      .int("Position invalide.")
      .min(1, "Position invalide.")
      .nullable(),
  },
  { message: "Ajout de section invalide." },
);

export const sectionIdSchema = z.object(
  { id: z.uuid("Identifiant de section invalide.") },
  { message: "Identifiant de section invalide." },
);

/**
 * Enregistrement du contenu d'une section.
 *
 * `content` est un `z.unknown()` : sa forme dépend du bloc, et c'est
 * `parseContenu()` qui la vérifie dans le cas d'usage. Le valider deux fois
 * avec deux schémas différents aurait produit deux messages d'erreur pour la
 * même faute.
 */
export const updateSectionSchema = z.object(
  {
    id: z.uuid("Identifiant de section invalide."),
    content: z.unknown(),
  },
  { message: "Modification de section invalide." },
);

export const setSectionVisibilitySchema = z.object(
  {
    id: z.uuid("Identifiant de section invalide."),
    isVisible: z.boolean("Visibilité invalide."),
  },
  { message: "Changement de visibilité invalide." },
);

/**
 * Réordonnancement des sections d'UNE page.
 *
 * ⚠️  `pageId` est obligatoire, contrairement aux neuf réordonnancements de la
 * série 8. La raison est dans la fonction SQL : `reorder_rows()` renumérote par
 * identifiants, sans notion de parent. Sur `page_sections`, les positions sont
 * relatives à une page — une liste d'identifiants mêlant deux pages
 * renumèroterait les deux, en silence. Le cas d'usage vérifie donc que tous les
 * identifiants appartiennent bien à la page annoncée.
 */
export const reorderSectionsSchema = z.object(
  {
    pageId: z.uuid("Identifiant de page invalide."),
    orderedIds: z
      .array(z.uuid("Identifiant de section invalide."), {
        message: "La liste des sections à réordonner est absente.",
      })
      .min(1, "Aucune section à réordonner."),
  },
  { message: "Liste de réordonnancement invalide." },
);

export type PageInput = z.infer<typeof pageSchema>;
export type CreatePageInput = z.infer<typeof createPageSchema>;
export type UpdatePageInput = z.infer<typeof updatePageSchema>;
export type PageFormInput = z.infer<typeof pageFormSchema>;
