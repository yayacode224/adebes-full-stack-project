import type {
  CreateProgramme,
  Programme,
  UpdateProgramme,
} from "@/core/cms/entities/programme";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  C'est le SEUL endroit du dépôt où l'on passe de `snake_case` à
 * `camelCase`. Aucun composant, aucun cas d'usage, aucune page ne doit jamais
 * voir `cover_media_id` ou `benevolat_label`.
 *
 * L'intérêt n'est pas cosmétique : le jour où une colonne est renommée, un
 * seul fichier change. Si la forme SQL fuit jusqu'à l'interface, un
 * `alter table … rename column` devient une chasse au trésor dans soixante
 * fichiers.
 */

/** SQL → domaine. */
export function toProgramme(row: Tables<"programmes">): Programme {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortTitle: row.short_title,
    summary: row.summary,
    icon: row.icon,
    tone: row.tone,
    actions: row.actions,
    publics: row.publics,
    besoins: row.besoins,
    benevolatLabel: row.benevolat_label,
    coverMediaId: row.cover_media_id,
    galleryMediaIds: row.gallery_media_ids,
    body: toParagraphes(row.body),
    position: row.position,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * `body` est du JSONB : la base garantit que c'est du JSON valide, pas que
 * c'est un tableau de chaînes.
 *
 * Une valeur inattendue — migration bâclée, écriture manuelle dans l'éditeur
 * SQL — est ramenée à `null` plutôt que propagée. C'est le même principe que
 * le `safeParse` du `SectionRenderer` (§9.4) : un JSONB abîmé ne doit jamais
 * casser une page en production.
 */
function toParagraphes(valeur: Tables<"programmes">["body"]): string[] | null {
  if (!Array.isArray(valeur)) return null;
  const paragraphes = valeur.filter((v): v is string => typeof v === "string");
  return paragraphes.length > 0 ? paragraphes : null;
}

/** Domaine → SQL, à la création. */
export function toProgrammeInsert(
  input: CreateProgramme & { slug: string },
): TablesInsert<"programmes"> {
  return {
    slug: input.slug,
    title: input.title,
    short_title: input.shortTitle,
    summary: input.summary,
    icon: input.icon,
    tone: input.tone,
    actions: input.actions,
    publics: input.publics,
    besoins: input.besoins,
    benevolat_label: input.benevolatLabel,
    cover_media_id: input.coverMediaId ?? null,
    gallery_media_ids: input.galleryMediaIds ?? [],
    body: input.body ?? null,
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
 * l'objet en une fois écraserait de `null` tous les champs absents de la
 * charge utile — c'est le bug classique du PATCH, et il se traduirait ici par
 * un programme dont le résumé disparaît parce qu'on a corrigé son titre.
 *
 * `null` reste distinct de `undefined` et passe : c'est ainsi qu'on retire une
 * image de couverture.
 */
export function toProgrammeUpdate(input: UpdateProgramme): TablesUpdate<"programmes"> {
  const row: TablesUpdate<"programmes"> = {};

  if (input.slug !== undefined) row.slug = input.slug;
  if (input.title !== undefined) row.title = input.title;
  if (input.shortTitle !== undefined) row.short_title = input.shortTitle;
  if (input.summary !== undefined) row.summary = input.summary;
  if (input.icon !== undefined) row.icon = input.icon;
  if (input.tone !== undefined) row.tone = input.tone;
  if (input.actions !== undefined) row.actions = input.actions;
  if (input.publics !== undefined) row.publics = input.publics;
  if (input.besoins !== undefined) row.besoins = input.besoins;
  if (input.benevolatLabel !== undefined) row.benevolat_label = input.benevolatLabel;
  if (input.coverMediaId !== undefined) row.cover_media_id = input.coverMediaId;
  if (input.galleryMediaIds !== undefined) row.gallery_media_ids = input.galleryMediaIds;
  if (input.body !== undefined) row.body = input.body;
  if (input.position !== undefined) row.position = input.position;
  if (input.status !== undefined) row.status = input.status;

  return row;
}
