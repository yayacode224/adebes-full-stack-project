import type {
  CreateGalleryCategory,
  CreateGalleryItem,
  GalleryCategory,
  GalleryItem,
  UpdateGalleryCategory,
  UpdateGalleryItem,
} from "@/core/cms/entities/gallery";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  C'est le SEUL endroit du dépôt où l'on passe de `snake_case` à
 * `camelCase`. Aucun composant, aucun cas d'usage, aucune page ne doit jamais
 * voir `media_id` ni `created_at`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUN REPLI ICI — ET C'EST UNE DIFFÉRENCE MESURÉE, PAS UNE ÉCONOMIE
 * ---------------------------------------------------------------------------
 * Les mappers des Lots 8E et 8F portaient chacun un repli :
 *
 *   * `core_values.icon` est un `text` LIBRE : la base accepte n'importe quoi
 *     (mesuré au Lot 8E), d'où le repli sur `Sparkles` (écart nº 110) ;
 *   * `faq_items.topic` est un `text` avec `check (...)` : la base refuse, mais
 *     `database.types.ts` le déclare `string` parce que le générateur ne lit
 *     pas les contraintes `check` — d'où une conversion obligatoire, dont la
 *     recette a vérifié qu'elle n'est jamais atteinte (écart nº 116).
 *
 * `gallery_categories.tone` n'est ni l'un ni l'autre : c'est un **énuméré
 * PostgreSQL** (`public.media_tone`, migration 0001), que le générateur SAIT
 * lire — `database.types.ts` le type
 * `Database["public"]["Enums"]["media_tone"]`, c'est-à-dire exactement le type
 * du domaine. Il n'y a donc rien à convertir, rien à replier, et un repli
 * ajouté « par prudence » serait du code mort qu'aucune recette ne pourrait
 * exercer.
 *
 * Même remarque pour `status`, énuméré lui aussi (`content_status`).
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * L'élément
 * ═══════════════════════════════════════════════════════════════════════════ */

/** SQL → domaine. */
export function toGalleryItem(row: Tables<"gallery_items">): GalleryItem {
  return {
    id: row.id,
    mediaId: row.media_id,
    categoryId: row.category_id,
    position: row.position,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Domaine → SQL, à la création. */
export function toGalleryItemInsert(
  input: CreateGalleryItem,
): TablesInsert<"gallery_items"> {
  return {
    media_id: input.mediaId,
    category_id: input.categoryId ?? null,
    position: input.position ?? 0,
    status: input.status ?? "draft",
  };
}

/**
 * Domaine → SQL, à la mise à jour.
 *
 * ⚠️  Seuls les champs RÉELLEMENT transmis sont inclus.
 *
 * `undefined` signifie « champ non modifié », pas « effacer ». Construire
 * l'objet en une fois écraserait de `null` tous les champs absents de la charge
 * utile — c'est le bug classique du PATCH, et il se traduirait ici par des
 * photos qui perdent leur catégorie parce qu'on a corrigé leur ordre.
 *
 * ⚠️  `category_id: null` DOIT passer, et c'est le point délicat de ce fichier :
 * c'est la seule façon d'exprimer « cette photo n'est plus classée ». Le test
 * porte donc sur `!== undefined`, jamais sur la véracité de la valeur — un
 * `if (input.categoryId)` aurait rendu le déclassement impossible, en silence.
 * C'est le jumeau exact du piège de `stat.value` au Lot 8G, où `0` est falsy.
 */
export function toGalleryItemUpdate(
  input: UpdateGalleryItem,
): TablesUpdate<"gallery_items"> {
  const row: TablesUpdate<"gallery_items"> = {};

  if (input.mediaId !== undefined) row.media_id = input.mediaId;
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.position !== undefined) row.position = input.position;
  if (input.status !== undefined) row.status = input.status;

  return row;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * La catégorie
 * ═══════════════════════════════════════════════════════════════════════════ */

export function toGalleryCategory(
  row: Tables<"gallery_categories">,
): GalleryCategory {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    tone: row.tone,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toGalleryCategoryInsert(
  input: CreateGalleryCategory & { slug: string },
): TablesInsert<"gallery_categories"> {
  return {
    slug: input.slug,
    label: input.label,
    tone: input.tone ?? "neutral",
    position: input.position ?? 0,
  };
}

export function toGalleryCategoryUpdate(
  input: UpdateGalleryCategory,
): TablesUpdate<"gallery_categories"> {
  const row: TablesUpdate<"gallery_categories"> = {};

  if (input.label !== undefined) row.label = input.label;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.tone !== undefined) row.tone = input.tone;
  if (input.position !== undefined) row.position = input.position;

  return row;
}
