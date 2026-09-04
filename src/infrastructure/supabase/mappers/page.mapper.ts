import type {
  CreatePage,
  CreatePageSection,
  Page,
  PageSection,
  UpdatePage,
  UpdatePageSection,
} from "@/core/cms/entities/page";

import type { Json, Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre les lignes SQL et les entités de domaine.
 *
 * ⚠️  Seul endroit du dépôt où l'on passe de `snake_case` à `camelCase`. Aucun
 * composant, aucun cas d'usage, aucune page ne doit jamais voir `is_system`,
 * `block_type` ou `og_media_id`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA COLONNE `pages.hero` N'EST PAS MAPPÉE, ET C'EST UN CHOIX
 * ---------------------------------------------------------------------------
 * La migration 0006 la déclare : « En-tête de page. Conservé hors des sections :
 * toute page en a un, et il ne se réordonne pas. »
 *
 * Le §10 du Rapport 1, lui, range l'en-tête dans le registre — `page-hero` est
 * le premier des dix-sept blocs. Les deux ne peuvent pas être vrais en même
 * temps, et c'est le registre qui l'emporte, pour trois raisons :
 *
 *   1. **une seule façon de saisir un contenu.** Un en-tête à part aurait eu
 *      son propre formulaire écrit à la main, c'est-à-dire exactement ce que
 *      `<SchemaForm>` existe pour éviter ;
 *   2. **toutes les pages n'ont pas d'en-tête de ce type** : l'accueil rend
 *      `<HomeHero>`, un composant plus riche et non paramétrable ;
 *   3. **l'ordre compte quand même.** Le bloc doit être en première position,
 *      et l'arbre des sections est le seul endroit qui le montre.
 *
 * La colonne reste donc VIDE sur les douze lignes (le seed ne l'alimente pas),
 * et aucune écriture de ce dépôt ne la touche. Elle sera retirée par une
 * migration du Lot 16 — la supprimer maintenant obligerait à régénérer les
 * types au milieu du lot sans rien apporter.
 */

/** SQL → domaine. */
export function toPage(row: Tables<"pages">): Page {
  return {
    id: row.id,
    slug: row.slug,
    route: row.route,
    title: row.title,
    status: row.status,
    isSystem: row.is_system,
    metaTitle: row.meta_title,
    metaDescription: row.meta_description,
    ogMediaId: row.og_media_id,
    publishedAt: row.published_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Domaine → SQL, à la création.
 *
 * ⚠️  Ni `status` ni `is_system` : les deux colonnes gardent leur valeur par
 * défaut (`'draft'` et `false`). Les écrire ici aurait offert un chemin de
 * création directement publiée, contournant `guard_publish` (ADB01).
 */
export function toPageInsert(input: CreatePage): TablesInsert<"pages"> {
  return {
    title: input.title,
    slug: input.slug ?? "",
    route: input.route ?? "",
    meta_title: input.metaTitle ?? null,
    meta_description: input.metaDescription ?? null,
    og_media_id: input.ogMediaId ?? null,
  };
}

/**
 * Domaine → SQL, à la mise à jour.
 *
 * ⚠️  Seuls les champs RÉELLEMENT transmis sont inclus : `undefined` signifie
 * « champ non modifié », pas « effacer ». Construire l'objet d'un bloc
 * écraserait de `null` tous les champs absents de la charge utile.
 *
 * La nuance est ici doublement importante : `metaTitle` et `metaDescription`
 * sont NULLABLES et `null` y porte un sens — « employer le titre de la page ».
 * Il faut donc distinguer `undefined` (ne pas toucher) de `null` (effacer),
 * ce qu'un `??` aurait confondu.
 */
export function toPageUpdate(input: UpdatePage): TablesUpdate<"pages"> {
  const row: TablesUpdate<"pages"> = {};

  if (input.title !== undefined) row.title = input.title;
  if (input.slug !== undefined) row.slug = input.slug;
  if (input.route !== undefined) row.route = input.route;
  if (input.metaTitle !== undefined) row.meta_title = input.metaTitle;
  if (input.metaDescription !== undefined) {
    row.meta_description = input.metaDescription;
  }
  if (input.ogMediaId !== undefined) row.og_media_id = input.ogMediaId;

  return row;
}

/**
 * SQL → domaine, pour une section.
 *
 * `content` traverse SANS conversion : c'est du JSONB, et sa forme dépend du
 * bloc. `parseContenu()` du registre est le seul endroit qui l'établit.
 */
export function toPageSection(row: Tables<"page_sections">): PageSection {
  return {
    id: row.id,
    pageId: row.page_id,
    blockType: row.block_type,
    position: row.position,
    content: row.content,
    isVisible: row.is_visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export function toPageSectionInsert(
  input: CreatePageSection,
): TablesInsert<"page_sections"> {
  return {
    page_id: input.pageId,
    block_type: input.blockType,
    position: input.position ?? 1,
    content: (input.content ?? {}) as Json,
    is_visible: input.isVisible ?? true,
  };
}

export function toPageSectionUpdate(
  input: UpdatePageSection,
): TablesUpdate<"page_sections"> {
  const row: TablesUpdate<"page_sections"> = {};

  if (input.content !== undefined) row.content = input.content as Json;
  if (input.isVisible !== undefined) row.is_visible = input.isVisible;

  return row;
}
