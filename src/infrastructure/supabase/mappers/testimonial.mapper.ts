import type {
  CreateTestimonial,
  Testimonial,
  UpdateTestimonial,
} from "@/core/cms/entities/testimonial";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  C'est le SEUL endroit du dépôt où l'on passe de `snake_case` à
 * `camelCase`. Aucun composant, aucun cas d'usage, aucune page ne doit jamais
 * voir `author_name` ou `photo_media_id`.
 *
 * Ce mapper est le plus simple des trois écrits jusqu'ici : aucune colonne
 * JSONB, aucun tableau. `testimonials` n'a que des scalaires et deux clés
 * étrangères.
 */

/** SQL → domaine. */
export function toTestimonial(row: Tables<"testimonials">): Testimonial {
  return {
    id: row.id,
    quote: row.quote,
    authorName: row.author_name,
    authorRole: row.author_role,
    programmeId: row.programme_id,
    photoMediaId: row.photo_media_id,
    hasConsent: row.has_consent,
    position: row.position,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Domaine → SQL, à la création. */
export function toTestimonialInsert(
  input: CreateTestimonial,
): TablesInsert<"testimonials"> {
  return {
    quote: input.quote,
    author_name: input.authorName,
    author_role: input.authorRole,
    programme_id: input.programmeId ?? null,
    photo_media_id: input.photoMediaId ?? null,
    has_consent: input.hasConsent,
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
 * un témoignage dont le programme cité disparaît parce qu'on a corrigé une
 * faute dans la citation.
 *
 * `null` reste distinct de `undefined` et passe : c'est ainsi qu'on détache un
 * témoignage de son programme ou qu'on retire sa photo.
 */
export function toTestimonialUpdate(
  input: UpdateTestimonial,
): TablesUpdate<"testimonials"> {
  const row: TablesUpdate<"testimonials"> = {};

  if (input.quote !== undefined) row.quote = input.quote;
  if (input.authorName !== undefined) row.author_name = input.authorName;
  if (input.authorRole !== undefined) row.author_role = input.authorRole;
  if (input.programmeId !== undefined) row.programme_id = input.programmeId;
  if (input.photoMediaId !== undefined) row.photo_media_id = input.photoMediaId;
  if (input.hasConsent !== undefined) row.has_consent = input.hasConsent;
  if (input.position !== undefined) row.position = input.position;
  if (input.status !== undefined) row.status = input.status;

  return row;
}
