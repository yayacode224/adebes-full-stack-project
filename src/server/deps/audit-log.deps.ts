import "server-only";

import type { AuditLogReadPort } from "@/core/cms/ports/audit-log.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseAuditLogRepository } from "@/infrastructure/supabase/repositories/audit-log.repository";

/**
 * Composition de la dépendance du journal d'activité (§13.3).
 *
 * Lecture seule, client de session : la RLS `audit_logs_admin_read` fait le
 * reste. Aucun port d'écriture — le journal est alimenté par `service_role`
 * depuis `action-kit/audit.ts` et purgé par le cron.
 */
export async function auditLogReadPort(): Promise<AuditLogReadPort> {
  return new SupabaseAuditLogRepository(await createServerClient());
}
