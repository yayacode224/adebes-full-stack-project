import type {
  CreateTeamMember,
  TeamMember,
  UpdateTeamMember,
} from "@/core/cms/entities/team-member";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  C'est le SEUL endroit du dépôt où l'on passe de `snake_case` à
 * `camelCase`. Aucun composant, aucun cas d'usage, aucune page ne doit jamais
 * voir `photo_media_id`.
 *
 * Le plus simple des quatre mappers écrits jusqu'ici : aucune colonne JSONB,
 * aucun tableau, une seule clé étrangère.
 */

/** SQL → domaine. */
export function toTeamMember(row: Tables<"team_members">): TeamMember {
  return {
    id: row.id,
    name: row.name,
    role: row.role,
    bio: row.bio,
    photoMediaId: row.photo_media_id,
    position: row.position,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Domaine → SQL, à la création. */
export function toTeamMemberInsert(
  input: CreateTeamMember,
): TablesInsert<"team_members"> {
  return {
    name: input.name,
    role: input.role,
    bio: input.bio ?? null,
    photo_media_id: input.photoMediaId ?? null,
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
 * une biographie qui disparaît parce qu'on a corrigé une faute dans le nom.
 *
 * `null` reste distinct de `undefined` et passe : c'est ainsi qu'on retire une
 * biographie ou une photo.
 */
export function toTeamMemberUpdate(
  input: UpdateTeamMember,
): TablesUpdate<"team_members"> {
  const row: TablesUpdate<"team_members"> = {};

  if (input.name !== undefined) row.name = input.name;
  if (input.role !== undefined) row.role = input.role;
  if (input.bio !== undefined) row.bio = input.bio;
  if (input.photoMediaId !== undefined) row.photo_media_id = input.photoMediaId;
  if (input.position !== undefined) row.position = input.position;
  if (input.status !== undefined) row.status = input.status;

  return row;
}
