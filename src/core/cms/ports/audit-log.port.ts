import type { AuditEntry, AuditFilters } from "../entities/audit-entry";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PORT DU JOURNAL D'ACTIVITÉ (§13.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * LECTURE SEULE. Le journal est alimenté par le client `service_role` depuis
 * `src/server/action-kit/audit.ts` (aucune politique d'insert n'existe) et
 * purgé par le cron. Rien dans le domaine n'y écrit — il n'y a donc pas de
 * `AuditLogWritePort`.
 */

export interface AuditLogReadPort {
  /**
   * Les entrées correspondant aux filtres, de la plus récente à la plus
   * ancienne, bornées à `limit` lignes.
   *
   * La borne est structurelle : le journal grossit d'une ligne par mutation, et
   * l'écran pagine en mémoire (comme les collections du Lot 8). `limit` protège
   * la charge utile RSC d'une base qui aurait des mois d'historique.
   */
  list(filters: AuditFilters, limit: number): Promise<AuditEntry[]>;
}
