"use server";

import type { ArticleCategory } from "@/core/cms/entities/article";
import {
  articleCategoryIdSchema,
  createArticleCategorySchema,
  reorderArticleCategoriesSchema,
  updateArticleCategorySchema,
} from "@/core/cms/schemas/article.schema";
import {
  createArticleCategory,
  deleteArticleCategory,
  reorderArticleCategories,
  updateArticleCategory,
} from "@/core/use-cases/article-categories/manage-categories";

import { createAction } from "../action-kit/create-action";
import { articleCategoryDeps } from "../deps/article.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES CATÉGORIES D'ACTUALITÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8B : « catégories gérables ». Quatre actions, toutes dans `createAction`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — LA PERMISSION DE CRÉATION EST `article:publish`
 * ---------------------------------------------------------------------------
 * C'est la seule anomalie apparente de ce fichier, et elle vient de la base,
 * pas d'un choix de confort. La migration 0009 déclare :
 *
 *     article_categories_staff_update  → app_is_staff()      (éditeur compris)
 *     article_categories_admin_insert  → app_can_publish()   (admin et au-delà)
 *     article_categories_admin_delete  → app_can_publish()   (admin et au-delà)
 *
 * La création d'une catégorie est donc réservée aux administrateurs. Or la
 * matrice du §9 ne contient AUCUNE permission `article:*` de création réservée
 * aux administrateurs : `article:create` est ouverte à l'éditeur, puisqu'un
 * éditeur rédige des articles.
 *
 * Les deux permissions dont les titulaires coïncident exactement avec
 * `app_can_publish()` sont `article:publish` et `article:delete`.
 * `article:delete` couvre naturellement la suppression ; il ne reste que
 * `article:publish` pour l'ajout. Le choix est donc contraint, et l'alternative
 * — inventer une ressource `category` dans `RESOURCES` — aurait ajouté six
 * permissions à un document d'audit pour une liste de cinq libellés, sans
 * qu'aucun rapport ne la prévoie.
 *
 * Ce qui compte, et qui est vérifié en recette : **l'interface n'affiche jamais
 * un bouton que la base refusera.** Un éditeur voit la liste, renomme et
 * réordonne ; il ne voit ni « Ajouter » ni « Supprimer », et le motif est
 * écrit à l'écran.
 *
 * ---------------------------------------------------------------------------
 * ÉTIQUETTES DE CACHE
 * ---------------------------------------------------------------------------
 * Renommer une catégorie change le libellé affiché sur CHAQUE carte d'article
 * et sur chaque bouton de filtre. La collection et les pages composées sont
 * donc invalidées, en plus de l'étiquette propre aux catégories.
 *
 * ⚠️  Les fiches individuelles (`cms:article:<slug>`) ne peuvent pas être
 * énumérées ici sans lire tous les articles de la catégorie. La parade prévue
 * au Lot 15 est inverse et plus simple : la lecture d'une fiche portera aussi
 * l'étiquette `cms:article-categories`, puisqu'elle en dépend réellement. Elle
 * est déjà nommée dans `articles.query.ts`.
 */

/*
  ⚠️  NON EXPORTÉ, ET CE N'EST PAS UN OUBLI.

  Dans un fichier `"use server"`, TOUT export doit être une fonction
  asynchrone : Next.js transforme le module en table d'actions, et un export
  qui n'en est pas une fait échouer la compilation avec « The module has no
  exports at all » — un message qui ne nomme pas le coupable.

  L'étiquette est publiée par `server/queries/articles.query.ts`, où vivent
  déjà les autres. Une seule définition, du côté qui les lit.
*/
const ETIQUETTE_CATEGORIES = "cms:article-categories";

const ETIQUETTES = [
  ETIQUETTE_CATEGORIES,
  "cms:articles",
  "cms:page:accueil",
  "cms:page:actualites",
];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création — administrateurs uniquement (voir l'en-tête)
 * ═══════════════════════════════════════════════════════════════════════════ */

export const creerCategorieAction = createAction<
  typeof createArticleCategorySchema,
  ArticleCategory
>({
  permission: "article:publish",
  input: createArticleCategorySchema,
  audit: {
    action: "article_category.create",
    entityType: "article_category",
    entityId: (categorie) => categorie.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    createArticleCategory(await articleCategoryDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Renommage — ouvert à l'éditeur, comme la RLS
 * ═══════════════════════════════════════════════════════════════════════════ */

export const renommerCategorieAction = createAction<
  typeof updateArticleCategorySchema,
  ArticleCategory
>({
  permission: "article:update",
  input: updateArticleCategorySchema,
  audit: {
    action: "article_category.update",
    entityType: "article_category",
    entityId: (categorie) => categorie.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    updateArticleCategory(await articleCategoryDeps(), input.id, input.label),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Suppression — administrateurs, et refusée si la catégorie sert encore
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠️  `articles.category_id` est en `on delete restrict` : la base refuse déjà.
 * Le cas d'usage compte les articles concernés AVANT, pour pouvoir dire combien
 * il y en a et quoi faire — un « Cet élément est utilisé ailleurs » laisse
 * l'utilisateur sans piste.
 */
export const supprimerCategorieAction = createAction<
  typeof articleCategoryIdSchema,
  { id: string; label: string }
>({
  permission: "article:delete",
  input: articleCategoryIdSchema,
  audit: {
    action: "article_category.delete",
    entityType: "article_category",
    entityId: (resultat) => resultat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    deleteArticleCategory(await articleCategoryDeps(), input.id),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement — l'ordre des filtres de /actualites
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `article:reorder` — ouvert à l'éditeur : réordonner n'est pas publier. La
 * base dit la même chose (`reorder_rows` exige `app_is_staff()`).
 *
 * C'est LE réordonnancement de ce lot : la table `articles`, elle, n'a pas de
 * colonne `position` — voir l'en-tête de `article.repository.ts`.
 */
export const reordonnerCategoriesAction = createAction<
  typeof reorderArticleCategoriesSchema,
  { count: number }
>({
  permission: "article:reorder",
  input: reorderArticleCategoriesSchema,
  audit: { action: "article_category.reorder", entityType: "article_category" },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const resultat = await reorderArticleCategories(
      await articleCategoryDeps(),
      input.orderedIds,
    );
    return resultat.ok
      ? { ok: true as const, value: { count: input.orderedIds.length } }
      : resultat;
  },
});
