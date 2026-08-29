import type { ContentStatus } from "./content-status";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ARTICLE D'ACTUALITÉ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reprise fidèle du type `Actualite` de `src/content/actualites.ts`, avec les
 * différences imposées par le passage en base :
 *
 *   1. `category` était une chaîne prise dans une union littérale de cinq
 *      valeurs ; c'est désormais `categoryId`, une clé étrangère vers
 *      `article_categories`. Les catégories sont GÉRABLES (§8B), donc elles ne
 *      peuvent plus être un type TypeScript.
 *   2. `date` devient `publishedAt`, et il est NULLABLE : un brouillon n'a pas
 *      de date de publication. La colonne accepte le passé (migration
 *      d'articles anciens) comme le futur (publication programmée, Lot 12).
 *   3. `readingMinutes` est NULLABLE. Le §8B le veut « calculé (200 mots/min)
 *      et modifiable » : `null` signifie « pas encore estimé », et le site
 *      n'affiche alors pas la mention — jamais « 0 min de lecture », qui serait
 *      un chiffre fabriqué (invariant nº 1).
 *   4. `placeholder?: boolean` devient `isPlaceholder: boolean` — la colonne
 *      est `not null default false`. Le badge « Exemple » du site en dépend.
 *   5. `id`, `status`, `authorId` et les horodatages apparaissent.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE `position` — ET CE N'EST PAS UN OUBLI
 * ---------------------------------------------------------------------------
 * Contrairement à `programmes`, la table `articles` n'a pas de colonne
 * `position` (migration 0005) : un fil d'actualités s'ordonne par sa DATE, pas
 * à la main. `published_at desc` est l'ordre du site comme celui du dashboard.
 *
 * Conséquence pour la recette du §8x, qui exige « CRUD complet +
 * réordonnancement » : le réordonnancement de ce lot porte sur les
 * CATÉGORIES — qui, elles, portent bien une `position`.
 *
 * Toutes les propriétés sont en `camelCase` : la forme SQL (`snake_case`,
 * `cover_media_id`) ne franchit jamais la frontière du mapper.
 */
export type Article = {
  id: string;
  /** Adresse de la page : `/actualites/<slug>`. Unique. */
  slug: string;
  title: string;
  /** Chapô : affiché sur la carte, en tête d'article et dans Google. */
  excerpt: string;
  /** Corps de l'article, un élément par paragraphe (forme de `Actualite.body`). */
  body: string[];
  categoryId: string | null;
  coverMediaId: string | null;
  /** Temps de lecture estimé, en minutes. `null` = non estimé. */
  readingMinutes: number | null;
  /** Exemple de mise en page — le site affiche un badge explicite. */
  isPlaceholder: boolean;
  /**
   * Date de publication, au format ISO. `null` tant qu'elle n'est pas fixée.
   *
   * ⚠️  Une date FUTURE ne fuit pas : la RLS filtre `published_at <= now()`
   * (écart nº 12), et les cas d'usage publics répètent la condition.
   */
  publishedAt: string | null;
  status: ContentStatus;
  /** Compte qui a créé l'article. Les noms arrivent avec l'annuaire (Lot 13). */
  authorId: string | null;
  createdAt: string;
  updatedAt: string;
};

/** Une catégorie d'actualité — collection dans la collection (§8B). */
export type ArticleCategory = {
  id: string;
  slug: string;
  label: string;
  position: number;
  createdAt: string;
  updatedAt: string;
};

/** Champs saisis à la création. Le reste est calculé ou par défaut. */
export type CreateArticle = Omit<
  Article,
  "id" | "createdAt" | "updatedAt" | "status" | "slug"
> & {
  /** Facultatif : dérivé du titre s'il est absent. */
  slug?: string;
  status?: ContentStatus;
};

/** Modification partielle. `id` identifie la cible, il n'est jamais modifiable. */
export type UpdateArticle = Partial<Omit<Article, "id" | "createdAt" | "updatedAt">>;

/** Création d'une catégorie. `position` est calculée en fin de liste. */
export type CreateArticleCategory = {
  label: string;
  /** Facultatif : dérivé du libellé s'il est absent. */
  slug?: string;
  position?: number;
};

export type UpdateArticleCategory = Partial<
  Pick<ArticleCategory, "label" | "slug" | "position">
>;
