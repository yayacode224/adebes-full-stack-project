import type { AuditEntry } from "@/core/cms/entities/audit-entry";

import type { Tables } from "../database.types";

/**
 * Ligne `audit_logs` → entité `AuditEntry`.
 *
 * Le nom de l'auteur n'est pas résolu ici : l'écran le rapproche de l'annuaire
 * déjà chargé (voir l'en-tête de l'entité). `ip` est du type `inet` côté base,
 * renvoyé en `unknown` par PostgREST — ramené à une chaîne pour l'affichage.
 */
export function toAuditEntry(row: Tables<"audit_logs">): AuditEntry {
  return {
    id: row.id,
    actorId: row.actor_id,
    action: row.action,
    entityType: row.entity_type,
    entityId: row.entity_id,
    diff: row.diff as unknown,
    ip: row.ip == null ? null : String(row.ip),
    userAgent: row.user_agent,
    createdAt: row.created_at,
  };
}
