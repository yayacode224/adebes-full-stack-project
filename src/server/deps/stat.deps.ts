import "server-only";

import type { StatDeps, StatReadPort } from "@/core/cms/ports/stat.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseStatRepository } from "@/infrastructure/supabase/repositories/stat.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DES CHIFFRES CLÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Gabarit de `programme.deps.ts` (écart nº 44). Les deux points qui se perdent
 * en le recopiant :
 *
 *   1. **Le client est reconstruit à CHAQUE appel.** `createServerClient()` lit
 *      les cookies de LA requête en cours ; mémoriser l'objet au niveau du
 *      module le ferait fuiter d'un visiteur à l'autre.
 *   2. **Une page du dashboard demande le port de LECTURE seul.** Une page qui
 *      affiche une liste ne doit pas recevoir un objet capable de supprimer, et
 *      le type l'en empêche.
 *
 * Un seul dépôt suffit : `stats` n'a aucune clé étrangère, rien n'est donc à
 * vérifier ailleurs avant d'écrire.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui protège
 * `server/queries/**` interdit cet import direct ; l'atteindre par ricochet la
 * rendrait inopérante. La lecture publique compose son propre dépôt, avec
 * `createPublicClient()`, dans `server/queries/stats.query.ts`.
 */
export async function statDeps(): Promise<StatDeps> {
  const chiffres = new SupabaseStatRepository(await createServerClient());
  return { read: chiffres, write: chiffres };
}

/** Le port de LECTURE seul — pour les pages du dashboard. */
export async function statReadPort(): Promise<StatReadPort> {
  return new SupabaseStatRepository(await createServerClient());
}
