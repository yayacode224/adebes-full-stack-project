import type {
  Article,
  ArticleCategory,
  CreateArticle,
  CreateArticleCategory,
  UpdateArticle,
  UpdateArticleCategory,
} from "@/core/cms/entities/article";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  C'est le SEUL endroit du dépôt où l'on passe de `snake_case` à
 * `camelCase` pour les actualités. Aucun composant, aucun cas d'usage, aucune
 * page ne doit jamais voir `cover_media_id`, `is_placeholder` ou
 * `reading_minutes`.
 */

/** SQL → domaine. */
export function toArticle(row: Tables<"articles">): Article {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    excerpt: row.excerpt,
    body: toParagraphes(row.body),
    categoryId: row.category_id,
    coverMediaId: row.cover_media_id,
    readingMinutes: row.reading_minutes,
    isPlaceholder: row.is_placeholder,
    publishedAt: row.published_at,
    status: row.status,
    authorId: row.author_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * `body` est du JSONB : la base garantit que c'est du JSON valide, pas que
 * c'est un tableau de chaînes.
 *
 * Une valeur inattendue — migration bâclée, écriture manuelle dans l'éditeur
 * SQL — est ramenée à un tableau vide plutôt que propagée. Même principe que
 * `toProgramme` : un JSONB abîmé ne doit jamais casser une page en production.
 *
 * ⚠️  Un tableau VIDE et non `null`, contrairement au `body` d'un programme :
 * `Article.body` est `string[]` sans nullabilité, parce qu'un article sans
 * corps n'est pas publiable (`setArticleStatus` le refuse). L'absence se dit
 * ici par la longueur, pas par un second état à traiter partout.
 */
function toParagraphes(valeur: Tables<"articles">["body"]): string[] {
  if (!Array.isArray(valeur)) return [];
  return valeur.filter((v): v is string => typeof v === "string");
}

/** Domaine → SQL, à la création. */
export function toArticleInsert(
  input: CreateArticle & { slug: string },
): TablesInsert<"articles"> {
  return {
    slug: input.slug,
    title: input.title,
    excerpt: input.excerpt,
    body: input.body,
    category_id: input.categoryId ?? null,
    cover_media_id: input.coverMediaId ?? null,
    reading_minutes: input.readingMinutes ?? null,
    is_placeholder: input.isPlaceholder ?? false,
    published_at: input.publishedAt ?? null,
    status: input.status ?? "draft",
    author_id: input.authorId ?? null,
  };
}

/**
 * Domaine → SQL, à la mise à jour.
 *
 * ⚠️  Seuls les champs RÉELLEMENT transmis sont inclus.
 *
 * `undefined` signifie « champ non modifié », pas « effacer ». Construire
 * l'objet en une fois écraserait de `null` tous les champs absents de la charge
 * utile — c'est le bug classique du PATCH, et il se traduirait ici par un
 * article dont la date de publication disparaît parce qu'on a corrigé son
 * titre.
 *
 * `null` reste distinct de `undefined` et passe : c'est ainsi qu'on retire une
 * image de couverture ou qu'on remet un article « sans catégorie ».
 */
export function toArticleUpdate(input: UpdateArticle): TablesUpdate<"articles"> {
  const row: TablesUpdate<"articles"> = {};

  if (input.slug !== undefined) row.slug = input.slug;
  if (input.title !== undefined) row.title = input.title;
  if (input.excerpt !== undefined) row.excerpt = input.excerpt;
  if (input.body !== undefined) row.body = input.body;
  if (input.categoryId !== undefined) row.category_id = input.categoryId;
  if (input.coverMediaId !== undefined) row.cover_media_id = input.coverMediaId;
  if (input.readingMinutes !== undefined) row.reading_minutes = input.readingMinutes;
  if (input.isPlaceholder !== undefined) row.is_placeholder = input.isPlaceholder;
  if (input.publishedAt !== undefined) row.published_at = input.publishedAt;
  if (input.status !== undefined) row.status = input.status;
  if (input.authorId !== undefined) row.author_id = input.authorId;

  return row;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Catégories
 * ═══════════════════════════════════════════════════════════════════════════ */

export function toArticleCategory(
  row: Tables<"article_categories">,
): ArticleCategory {
  return {
    id: row.id,
    slug: row.slug,
    label: row.label,
    position: row.position,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toArticleCategoryInsert(
  input: CreateArticleCategory & { slug: string },
): TablesInsert<"article_categories"> {
  return {
    slug: input.slug,
    label: input.label,
    position: input.position ?? 0,
  };
}

export function toArticleCategoryUpdate(
  input: UpdateArticleCategory,
): TablesUpdate<"article_categories"> {
  const row: TablesUpdate<"article_categories"> = {};

  if (input.slug !== undefined) row.slug = input.slug;
  if (input.label !== undefined) row.label = input.label;
  if (input.position !== undefined) row.position = input.position;

  return row;
}
