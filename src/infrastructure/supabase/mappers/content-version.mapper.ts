import type {
  ContentVersion,
  CreateContentVersion,
} from "@/core/cms/entities/content-version";

import type { Json, Tables, TablesInsert } from "../database.types";

/**
 * Conversion entre la ligne `content_versions` et l'entité de domaine.
 *
 * ⚠️  `snapshot` traverse la frontière en `unknown`, jamais en `Json` typé :
 * l'entité de domaine ne connaît pas le type `Json` de PostgREST, et le
 * lecteur de l'instantané le revalide de toute façon avec le schéma de son
 * entité (`articleSchema`, `pageSnapshotSchema`).
 */

/** SQL → domaine. */
export function toContentVersion(row: Tables<"content_versions">): ContentVersion {
  return {
    id: row.id,
    entityType: row.entity_type,
    entityId: row.entity_id,
    versionNumber: row.version_number,
    snapshot: row.snapshot as unknown,
    comment: row.comment,
    createdBy: row.created_by,
    createdAt: row.created_at,
  };
}

/**
 * Domaine → SQL, à l'insertion.
 *
 * `versionNumber` est passé à part : il est calculé par le dépôt (dernier + 1)
 * et n'appartient pas au contrat d'entrée du cas d'usage.
 */
export function toContentVersionInsert(
  input: CreateContentVersion & { versionNumber: number },
): TablesInsert<"content_versions"> {
  return {
    entity_type: input.entityType,
    entity_id: input.entityId,
    version_number: input.versionNumber,
    // L'instantané est du JSON quelconque côté domaine ; PostgREST attend `Json`.
    snapshot: input.snapshot as Json,
    comment: input.comment,
    created_by: input.createdBy,
  };
}
