import "server-only";

import type {
  FaqItemDeps,
  FaqItemReadPort,
} from "@/core/cms/ports/faq-item.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseFaqItemRepository } from "@/infrastructure/supabase/repositories/faq-item.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DES QUESTIONS FRÉQUENTES
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
 * Un seul dépôt suffit : `faq_items` n'a aucune clé étrangère, rien n'est donc
 * à vérifier ailleurs avant d'écrire.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui protège
 * `server/queries/**` interdit cet import direct ; l'atteindre par ricochet la
 * rendrait inopérante. La lecture publique compose son propre dépôt, avec
 * `createPublicClient()`, dans `server/queries/faq.query.ts`.
 */
export async function faqItemDeps(): Promise<FaqItemDeps> {
  const questions = new SupabaseFaqItemRepository(await createServerClient());
  return { read: questions, write: questions };
}

/** Le port de LECTURE seul — pour les pages du dashboard. */
export async function faqItemReadPort(): Promise<FaqItemReadPort> {
  return new SupabaseFaqItemRepository(await createServerClient());
}
