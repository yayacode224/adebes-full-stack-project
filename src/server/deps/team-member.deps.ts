import "server-only";

import type {
  TeamMemberDeps,
  TeamMemberReadPort,
} from "@/core/cms/ports/team-member.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseTeamMemberRepository } from "@/infrastructure/supabase/repositories/team-member.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DES MEMBRES DE L'ÉQUIPE
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
 * Un seul dépôt suffit ici, là où les témoignages en composaient deux : rien
 * n'est à vérifier dans une autre table avant d'écrire.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui protège
 * `server/queries/**` interdit cet import direct ; l'atteindre par ricochet la
 * rendrait inopérante. La lecture publique compose son propre dépôt, avec
 * `createPublicClient()`, dans `server/queries/team.query.ts`.
 */
export async function teamMemberDeps(): Promise<TeamMemberDeps> {
  const membres = new SupabaseTeamMemberRepository(await createServerClient());
  return { read: membres, write: membres };
}

/** Le port de LECTURE seul — pour les pages du dashboard. */
export async function teamMemberReadPort(): Promise<TeamMemberReadPort> {
  return new SupabaseTeamMemberRepository(await createServerClient());
}
