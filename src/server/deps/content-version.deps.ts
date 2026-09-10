import "server-only";

import type {
  ContentVersionDeps,
  ContentVersionReadPort,
} from "@/core/cms/ports/content-version.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseContentVersionRepository } from "@/infrastructure/supabase/repositories/content-version.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DE L'HISTORIQUE DE CONTENU
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Gabarit des autres `*.deps.ts`. Les deux points qui comptent :
 *
 *   1. **Le client est reconstruit à CHAQUE appel** — `createServerClient()`
 *      lit les cookies de LA requête en cours.
 *   2. **Une page d'historique demande le port de LECTURE seul.** Elle liste et
 *      compare ; enregistrer un instantané ou purger ne relève que de la
 *      Server Action de publication.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  NON IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. L'historique n'est jamais
 * lu par le site public — il n'a pas de lecture publique mise en cache.
 */
export async function contentVersionDeps(): Promise<ContentVersionDeps> {
  const repo = new SupabaseContentVersionRepository(await createServerClient());
  return { read: repo, write: repo };
}

/** Le port de LECTURE seul — pour les écrans d'historique du dashboard. */
export async function contentVersionReadPort(): Promise<ContentVersionReadPort> {
  return new SupabaseContentVersionRepository(await createServerClient());
}
