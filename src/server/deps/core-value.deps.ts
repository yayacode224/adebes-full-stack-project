import "server-only";

import type {
  CoreValueDeps,
  CoreValueReadPort,
} from "@/core/cms/ports/core-value.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseCoreValueRepository } from "@/infrastructure/supabase/repositories/core-value.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DES VALEURS
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
 * Un seul dépôt suffit : `core_values` n'a aucune clé étrangère, rien n'est
 * donc à vérifier ailleurs avant d'écrire.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui protège
 * `server/queries/**` interdit cet import direct ; l'atteindre par ricochet la
 * rendrait inopérante. La lecture publique compose son propre dépôt, avec
 * `createPublicClient()`, dans `server/queries/values.query.ts`.
 */
export async function coreValueDeps(): Promise<CoreValueDeps> {
  const valeurs = new SupabaseCoreValueRepository(await createServerClient());
  return { read: valeurs, write: valeurs };
}

/** Le port de LECTURE seul — pour les pages du dashboard. */
export async function coreValueReadPort(): Promise<CoreValueReadPort> {
  return new SupabaseCoreValueRepository(await createServerClient());
}
