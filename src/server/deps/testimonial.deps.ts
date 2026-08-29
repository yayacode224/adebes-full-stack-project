import "server-only";

import type {
  TestimonialDeps,
  TestimonialReadPort,
} from "@/core/cms/ports/testimonial.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseProgrammeRepository } from "@/infrastructure/supabase/repositories/programme.repository";
import { SupabaseTestimonialRepository } from "@/infrastructure/supabase/repositories/testimonial.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DES TÉMOIGNAGES
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
 * Un seul client Supabase alimente les DEUX dépôts d'un même appel : ils
 * partagent la session, et en construire deux doublerait le travail pour rien.
 * Le dépôt des programmes est ici en LECTURE — les témoignages vérifient que
 * le programme cité existe, ils ne le modifient jamais.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui protège
 * `server/queries/**` interdit cet import direct ; l'atteindre par ricochet la
 * rendrait inopérante. La lecture publique compose son propre dépôt, avec
 * `createPublicClient()`, dans `server/queries/testimonials.query.ts`.
 */
export async function testimonialDeps(): Promise<TestimonialDeps> {
  const supabase = await createServerClient();

  const temoignages = new SupabaseTestimonialRepository(supabase);
  const programmes = new SupabaseProgrammeRepository(supabase);

  return { read: temoignages, write: temoignages, programmes };
}

/** Le port de LECTURE seul — pour les pages du dashboard. */
export async function testimonialReadPort(): Promise<TestimonialReadPort> {
  return new SupabaseTestimonialRepository(await createServerClient());
}
