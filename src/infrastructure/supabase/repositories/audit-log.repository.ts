import type { SupabaseClient } from "@supabase/supabase-js";

import type { AuditEntry, AuditFilters } from "@/core/cms/entities/audit-entry";
import type { AuditLogReadPort } from "@/core/cms/ports/audit-log.port";
import { DECALAGE_SITE } from "@/lib/dates";

import type { Database } from "../database.types";
import { mapPostgrestError } from "../errors";
import { toAuditEntry } from "../mappers/audit-entry.mapper";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  DÉPÔT SUPABASE DU JOURNAL D'ACTIVITÉ (§13.3)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lecture seule. Reçoit le client de session : la RLS `audit_logs_admin_read`
 * (`app_can_publish()`) réserve la table aux administrateurs. Un éditeur
 * n'atteint jamais ce code — la page exige `audit:read` —, mais s'il forçait la
 * requête, la base lui renverrait zéro ligne.
 *
 * Les bornes de période arrivent en date simple (`AAAA-MM-JJ`) et sont
 * interprétées dans le FUSEAU ÉDITORIAL du site (`Africa/Douala`, décalage
 * constant `+01:00`) : « le 3 septembre » commence à 00:00 à Douala, pas à
 * Londres.
 */
export class SupabaseAuditLogRepository implements AuditLogReadPort {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  async list(filters: AuditFilters, limit: number): Promise<AuditEntry[]> {
    let requete = this.supabase
      .from("audit_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(limit);

    if (filters.actorId) requete = requete.eq("actor_id", filters.actorId);
    if (filters.entityType) {
      requete = requete.eq("entity_type", filters.entityType);
    }
    if (filters.action) requete = requete.eq("action", filters.action);

    if (filters.from) {
      const debut = new Date(`${filters.from}T00:00:00${DECALAGE_SITE}`);
      if (!Number.isNaN(debut.getTime())) {
        requete = requete.gte("created_at", debut.toISOString());
      }
    }
    if (filters.to) {
      const fin = new Date(`${filters.to}T23:59:59.999${DECALAGE_SITE}`);
      if (!Number.isNaN(fin.getTime())) {
        requete = requete.lte("created_at", fin.toISOString());
      }
    }

    const { data, error } = await requete;
    if (error) throw mapPostgrestError(error, { ressource: "journal" });

    return (data ?? []).map(toAuditEntry);
  }
}
