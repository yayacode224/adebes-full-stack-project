import "server-only";

import type {
  AnnualReportDeps,
  AnnualReportReadPort,
} from "@/core/cms/ports/annual-report.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseAnnualReportRepository } from "@/infrastructure/supabase/repositories/annual-report.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DES RAPPORTS ANNUELS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Gabarit de `programme.deps.ts` (écart nº 44), dans sa forme la plus simple :
 * une seule table, donc un seul dépôt. Les deux points qui se perdent en le
 * recopiant :
 *
 *   1. **Le client est reconstruit à CHAQUE appel.** `createServerClient()` lit
 *      les cookies de LA requête en cours ; mémoriser l'objet au niveau du
 *      module le ferait fuiter d'un visiteur à l'autre.
 *   2. **Une page du dashboard demande le port de LECTURE seul.** Une page qui
 *      affiche une liste ne doit pas recevoir un objet capable de supprimer, et
 *      le type l'en empêche.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui protège
 * `server/queries/**` interdit cet import direct ; l'atteindre par ricochet la
 * rendrait inopérante. La lecture publique compose son propre dépôt, avec
 * `createPublicClient()`, dans `server/queries/annual-report.query.ts`.
 *
 * C'est la neuvième et dernière fabrique de la série 8 — `server/deps/` porte
 * désormais une entrée par collection, exactement comme l'écart nº 44
 * l'annonçait.
 */
export async function annualReportDeps(): Promise<AnnualReportDeps> {
  const supabase = await createServerClient();
  const rapports = new SupabaseAnnualReportRepository(supabase);

  return { read: rapports, write: rapports };
}

/** Le port de LECTURE seul — pour les pages du dashboard. */
export async function annualReportReadPort(): Promise<AnnualReportReadPort> {
  return new SupabaseAnnualReportRepository(await createServerClient());
}
