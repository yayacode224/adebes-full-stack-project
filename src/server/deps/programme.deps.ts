import "server-only";

import type {
  ProgrammeDeps,
  ProgrammeReadPort,
} from "@/core/cms/ports/programme.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseProgrammeRepository } from "@/infrastructure/supabase/repositories/programme.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DES PROGRAMMES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Gabarit de `media.deps.ts` (écart nº 44), qui porte le raisonnement complet
 * sur l'existence de ce dossier. Deux points valent d'être répétés ici, parce
 * qu'ils se perdent facilement en les recopiant huit fois pour les lots
 * 8B → 8I :
 *
 *   1. **Le client est reconstruit à CHAQUE appel.** `createServerClient()`
 *      lit les cookies de LA requête en cours ; mémoriser l'objet au niveau du
 *      module le ferait fuiter d'un visiteur à l'autre. Le coût est celui
 *      d'une construction d'objet, pas d'un aller-retour réseau.
 *   2. **Une page du dashboard demande le port de LECTURE seul.** Ce n'est pas
 *      une politesse : une page qui affiche une liste ne doit pas recevoir un
 *      objet capable de supprimer, et le type l'en empêche.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui
 * protège `server/queries/**` interdit cet import direct ; l'atteindre par
 * ricochet la rendrait inopérante — exactement le raisonnement qui a fait
 * refuser un barrel `clients/index.ts` (écart nº 16).
 *
 * La lecture publique compose donc son propre dépôt, avec
 * `createPublicClient()`, dans `server/queries/programmes.query.ts`.
 */
export async function programmeDeps(): Promise<ProgrammeDeps> {
  const repository = new SupabaseProgrammeRepository(await createServerClient());

  return { read: repository, write: repository };
}

/** Le port de LECTURE seul — pour les pages du dashboard. */
export async function programmeReadPort(): Promise<ProgrammeReadPort> {
  return new SupabaseProgrammeRepository(await createServerClient());
}
