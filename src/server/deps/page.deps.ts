import "server-only";

import type {
  PageDeps,
  PageReadPort,
  SectionReadPort,
} from "@/core/cms/ports/page.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabasePageSectionRepository } from "@/infrastructure/supabase/repositories/page-section.repository";
import { SupabasePageRepository } from "@/infrastructure/supabase/repositories/page.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DES PAGES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Gabarit des neuf `*.deps.ts` de la série 8, avec une différence : **deux
 * dépôts**, parce qu'il y a deux tables et quatre ports.
 *
 * Les deux points qui se perdent en recopiant le gabarit :
 *
 *   1. **Les clients sont reconstruits à CHAQUE appel.** `createServerClient()`
 *      lit les cookies de LA requête en cours ; mémoriser l'objet au niveau du
 *      module le ferait fuiter d'un visiteur à l'autre.
 *   2. **Une page du dashboard demande le port de LECTURE seul.** Un écran qui
 *      affiche une liste ne doit pas recevoir un objet capable de supprimer, et
 *      le type l'en empêche.
 *
 * ⚠️  UN SEUL CLIENT POUR LES DEUX DÉPÔTS. Deux appels à `createServerClient()`
 * produiraient deux clients lisant les mêmes cookies — sans erreur, mais avec
 * deux jeux de jetons rafraîchis indépendamment. Le client est donc construit
 * une fois et injecté aux deux.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui protège
 * `server/queries/**` interdit cet import direct ; l'atteindre par ricochet la
 * rendrait inopérante. Le rendu public compose son propre dépôt, avec
 * `createPublicClient()`, dans `server/queries/pages.query.ts`.
 */
export async function pageDeps(): Promise<PageDeps> {
  const supabase = await createServerClient();
  const pages = new SupabasePageRepository(supabase);
  const sections = new SupabasePageSectionRepository(supabase);

  return {
    read: pages,
    write: pages,
    sectionRead: sections,
    sectionWrite: sections,
  };
}

/** Le port de LECTURE des pages seul — pour la liste du dashboard. */
export async function pageReadPort(): Promise<PageReadPort> {
  return new SupabasePageRepository(await createServerClient());
}

/** Le port de LECTURE des sections seul — pour l'arbre de l'éditeur. */
export async function sectionReadPort(): Promise<SectionReadPort> {
  return new SupabasePageSectionRepository(await createServerClient());
}
