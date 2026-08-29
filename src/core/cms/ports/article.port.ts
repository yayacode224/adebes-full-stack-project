import type { ListFilter } from "../../shared/pagination";
import type { ContentStatus } from "../entities/content-status";
import type {
  Article,
  ArticleCategory,
  CreateArticle,
  CreateArticleCategory,
  UpdateArticle,
  UpdateArticleCategory,
} from "../entities/article";

/**
 * Ports de l'actualité — la frontière entre le domaine et la persistance.
 *
 * Même découpage qu'au Lot 8A (`programme.port.ts`), et pour la même raison :
 * une lecture publique reçoit un `ArticleReadPort` et rien d'autre. Elle ne
 * peut pas écrire — pas par convention, mais parce que le type ne le permet
 * pas.
 *
 * ---------------------------------------------------------------------------
 * DEUX FAMILLES DE PORTS, PAS UNE
 * ---------------------------------------------------------------------------
 * Les catégories sont une collection DISTINCTE (table `article_categories`),
 * avec ses propres droits en base : la RLS ouvre la modification au personnel
 * mais réserve l'ajout et la suppression à `app_can_publish()` (migration
 * 0009). Les fondre dans le port des articles aurait fait croire qu'un même
 * jeu de droits couvre les deux.
 *
 * Elles restent néanmoins réunies dans `ArticleDeps` : tout cas d'usage qui
 * écrit un article a besoin de lire les catégories — ne serait-ce que pour
 * refuser une catégorie qui n'existe plus.
 */

export interface ArticleReadPort {
  findAll(filter?: ListFilter): Promise<Article[]>;
  findBySlug(slug: string): Promise<Article | null>;
  findById(id: string): Promise<Article | null>;
  count(filter?: ListFilter): Promise<number>;
  /** Tous les slugs existants — sert à garantir l'unicité à la création. */
  listSlugs(): Promise<string[]>;
  /**
   * Les articles PUBLIÉS et dont la date est échue.
   *
   * Méthode à part plutôt qu'un `filter` de plus : la condition
   * `published_at <= now()` est une règle de publication, pas un filtre
   * d'affichage. La laisser à l'appelant, c'est accepter qu'un appelant
   * l'oublie — et faire fuiter un article programmé.
   */
  findPublished(limit?: number): Promise<Article[]>;
  /** Combien d'articles rattachés à cette catégorie. Refus de suppression. */
  countByCategory(categoryId: string): Promise<number>;
}

export interface ArticleWritePort {
  create(input: CreateArticle): Promise<Article>;
  update(id: string, input: UpdateArticle): Promise<Article>;
  delete(id: string): Promise<void>;
  /**
   * Change l'état éditorial, et FIXE la date de publication au passage.
   *
   * Les deux vont ensemble : publier un article sans date le rendrait visible
   * tout en le laissant inclassable dans un fil trié par date. Deux écritures
   * séparées auraient laissé la fenêtre où l'une réussit et l'autre échoue.
   *
   * `publishedAt` omis = date inchangée.
   */
  setStatus(
    id: string,
    status: ContentStatus,
    publishedAt?: string | null,
  ): Promise<Article>;
}

export interface ArticleCategoryReadPort {
  findAll(): Promise<ArticleCategory[]>;
  findById(id: string): Promise<ArticleCategory | null>;
  findBySlug(slug: string): Promise<ArticleCategory | null>;
}

export interface ArticleCategoryWritePort {
  create(input: CreateArticleCategory): Promise<ArticleCategory>;
  update(id: string, input: UpdateArticleCategory): Promise<ArticleCategory>;
  delete(id: string): Promise<void>;
  /** Réordonne en UNE transaction — `reorder_rows('article_categories')`. */
  reorder(orderedIds: string[]): Promise<void>;
}

/**
 * Regroupement de confort pour les cas d'usage qui écrivent un article.
 *
 * `categories` est en LECTURE seule ici : écrire un article ne crée jamais une
 * catégorie au passage. Les cas d'usage qui gèrent les catégories reçoivent
 * `ArticleCategoryDeps`, ci-dessous.
 */
export type ArticleDeps = {
  read: ArticleReadPort;
  write: ArticleWritePort;
  categories: ArticleCategoryReadPort;
};

export type ArticleCategoryDeps = {
  read: ArticleCategoryReadPort;
  write: ArticleCategoryWritePort;
  /** Pour refuser la suppression d'une catégorie encore utilisée. */
  articles: Pick<ArticleReadPort, "countByCategory">;
};
