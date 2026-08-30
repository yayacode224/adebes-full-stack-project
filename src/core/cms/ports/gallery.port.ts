import type { ListFilter } from "../../shared/pagination";
import type { ContentStatus } from "../entities/content-status";
import type {
  CreateGalleryCategory,
  CreateGalleryItem,
  GalleryCategory,
  GalleryItem,
  UpdateGalleryCategory,
  UpdateGalleryItem,
} from "../entities/gallery";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PORTS DE LA GALERIE — la frontière entre le domaine et la persistance
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Même découpage lecture / écriture qu'aux Lots 8A à 8G (principe I de
 * SOLID) : une lecture publique reçoit un `GalleryItemReadPort` et rien
 * d'autre. Elle ne peut pas écrire — pas par convention, mais parce que le type
 * ne le permet pas.
 *
 * ---------------------------------------------------------------------------
 * DEUX FAMILLES DE PORTS, PAS UNE — comme au Lot 8B
 * ---------------------------------------------------------------------------
 * Les catégories sont une collection DISTINCTE (`gallery_categories`), avec ses
 * propres droits en base : la RLS ouvre la modification au personnel mais
 * réserve l'ajout et la suppression à `app_can_publish()` (migration 0009). Les
 * fondre dans le port des éléments aurait fait croire qu'un même jeu de droits
 * couvre les deux.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX CLÉS ÉTRANGÈRES, ET ELLES NE SE COMPORTENT PAS PAREIL
 * ---------------------------------------------------------------------------
 * `gallery_items` est la table la plus liée du Lot 8 :
 *
 *   * `media_id` → `media_assets`, **`not null`, `on delete restrict`**. La
 *     photo doit exister avant l'élément, et elle ne peut pas être supprimée
 *     tant qu'il existe. C'est ce qui rend `countByMedia` nécessaire : le
 *     dashboard doit pouvoir dire « cette photo est déjà dans la galerie »
 *     avant de la proposer une seconde fois.
 *   * `category_id` → `gallery_categories`, **nullable, `on delete restrict`**.
 *     D'où `countByCategory`, qui permet de refuser la suppression d'une
 *     catégorie encore employée en DISANT combien d'éléments sont concernés —
 *     la base, elle, ne rendrait qu'un 23503 anonyme.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * L'élément
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface GalleryItemReadPort {
  findAll(filter?: ListFilter): Promise<GalleryItem[]>;
  findById(id: string): Promise<GalleryItem | null>;
  count(filter?: ListFilter): Promise<number>;
  /**
   * Les éléments publiés, dans l'ordre d'affichage.
   *
   * Aucun paramètre de sélection, contrairement au Lot 8F : la page `/galerie`
   * charge la grille ENTIÈRE et le filtre par catégorie est appliqué **dans le
   * navigateur**, sans rechargement — c'est le comportement actuel du site
   * (`<GalleryGrid>`, Lot 2) et l'audit §2 le range parmi les rares bons
   * patrons de l'ancien site. Filtrer côté serveur imposerait un aller-retour
   * par clic de bouton, pour une collection qui se compte en dizaines.
   */
  findPublished(options?: { limit?: number }): Promise<GalleryItem[]>;
  /**
   * Combien d'éléments emploient cette catégorie ?
   *
   * Sert à refuser une suppression en la MOTIVANT. `category_id` est en
   * `on delete restrict` : sans ce décompte, l'utilisateur lirait « Cet élément
   * est utilisé ailleurs » sans savoir combien de photos reclasser.
   */
  countByCategory(categoryId: string): Promise<number>;
  /**
   * Combien d'éléments emploient ce média ?
   *
   * Rien ne l'interdit en base — une même photo peut légitimement figurer deux
   * fois — mais la grille publique l'afficherait alors deux fois, ce qui
   * ressemble trait pour trait à un défaut d'affichage. L'écran le SIGNALE, il
   * ne l'interdit pas : doctrine de l'écart nº 115.
   */
  countByMedia(mediaId: string): Promise<number>;
}

export interface GalleryItemWritePort {
  create(input: CreateGalleryItem): Promise<GalleryItem>;
  update(id: string, input: UpdateGalleryItem): Promise<GalleryItem>;
  delete(id: string): Promise<void>;
  /** Réordonne en UNE transaction — `reorder_rows('gallery_items')` (§3.4). */
  reorder(orderedIds: string[]): Promise<void>;
  setStatus(id: string, status: ContentStatus): Promise<GalleryItem>;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * La catégorie
 * ═══════════════════════════════════════════════════════════════════════════ */

export interface GalleryCategoryReadPort {
  findAll(): Promise<GalleryCategory[]>;
  findById(id: string): Promise<GalleryCategory | null>;
  findBySlug(slug: string): Promise<GalleryCategory | null>;
}

export interface GalleryCategoryWritePort {
  create(input: CreateGalleryCategory): Promise<GalleryCategory>;
  update(id: string, input: UpdateGalleryCategory): Promise<GalleryCategory>;
  delete(id: string): Promise<void>;
  /** Réordonne en UNE transaction — `reorder_rows('gallery_categories')`. */
  reorder(orderedIds: string[]): Promise<void>;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Regroupements de confort
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Dépendances des cas d'usage qui écrivent un ÉLÉMENT.
 *
 * `categories` est en LECTURE seule : classer une photo ne crée jamais une
 * catégorie au passage. C'est ce qui permet à `createGalleryItem` de refuser
 * une catégorie qui n'existe plus, avec un message français, plutôt que de
 * laisser remonter un 23503.
 */
export type GalleryItemDeps = {
  read: GalleryItemReadPort;
  write: GalleryItemWritePort;
  categories: GalleryCategoryReadPort;
};

/** Dépendances des cas d'usage qui gèrent les CATÉGORIES. */
export type GalleryCategoryDeps = {
  read: GalleryCategoryReadPort;
  write: GalleryCategoryWritePort;
  /** Pour refuser la suppression d'une catégorie encore employée. */
  items: Pick<GalleryItemReadPort, "countByCategory">;
};
