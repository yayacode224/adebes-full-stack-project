import { createClient } from "@supabase/supabase-js";

import type { Database } from "../database.types";
import { requireSupabaseEnv } from "./env";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CLIENT PUBLIC — SANS COOKIES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  USAGE AUTORISÉ    Lectures publiques mises en cache : les fonctions
 *                    `'use cache'` de `src/server/queries/`.
 *
 *  INTERDIT          Toute lecture de contenu NON publié. Toute écriture.
 *                    Toute opération qui dépend de l'utilisateur connecté.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CETTE FABRIQUE EXISTE
 * ---------------------------------------------------------------------------
 * Un scope `'use cache'` ne peut pas lire `cookies()` — Next.js 16 lève une
 * erreur. Or `createServerClient()` lit les cookies. Une lecture publique mise
 * en cache doit donc utiliser un client qui n'en lit aucun.
 *
 * Ce client s'authentifie comme `anon`. La RLS ne lui laisse voir que le
 * contenu publié — ce qui est exactement le comportement voulu pour du contenu
 * mis en cache et servi à tout le monde. Mettre en cache une réponse
 * personnalisée serait au mieux inutile, au pire une fuite de données entre
 * visiteurs.
 *
 * ⚠️  Confondre ce client avec `createServerClient` est, d'après le §16 du
 * Rapport 1, l'erreur la plus probable de tout ce chantier. Une règle ESLint
 * interdit d'importer `clients/server` depuis `src/server/queries/**` — elle
 * a été vérifiée au Lot 0.
 */
export function createPublicClient() {
  const { url, anonKey } = requireSupabaseEnv();

  return createClient<Database>(url, anonKey, {
    auth: {
      // Aucune session à conserver ni à rafraîchir : ce client est anonyme par
      // construction, et il est recréé à chaque appel.
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
