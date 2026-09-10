import type { AuditEntry, AuditFilters } from "../../cms/entities/audit-entry";
import type { AuditLogReadPort } from "../../cms/ports/audit-log.port";
import { ok, type Result } from "../../shared/result";

/**
 * Les entrées du journal correspondant aux filtres, bornées à `limit`.
 *
 * `createAction` ne protège pas cette lecture (elle passe par une page, pas une
 * Server Action) : la permission `audit:read` est exigée par la page, et la RLS
 * `audit_logs_admin_read` refuse de toute façon la table à un éditeur.
 */
export async function listAuditEntries(
  read: AuditLogReadPort,
  filters: AuditFilters,
  limit: number,
): Promise<Result<AuditEntry[]>> {
  return ok(await read.list(filters, limit));
}
