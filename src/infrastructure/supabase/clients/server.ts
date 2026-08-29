import { createServerClient as createSSRClient } from "@supabase/ssr";
import { cookies } from "next/headers";

import type { Database } from "../database.types";
import { requireSupabaseEnv } from "./env";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CLIENT SERVEUR — AVEC COOKIES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  USAGE AUTORISÉ    DAL (`src/server/dal/`), Server Actions, pages et layouts
 *                    du dashboard. Partout où l'identité de l'utilisateur
 *                    connecté compte.
 *
 *  ⚠️  INTERDIT      DANS UN SCOPE `'use cache'`.
 *
 * ---------------------------------------------------------------------------
 * Ce client lit les cookies pour retrouver la session Supabase. C'est ce qui
 * permet à PostgreSQL de connaître `auth.uid()`, donc aux politiques RLS de
 * s'appliquer à la bonne personne.
 *
 * Et c'est exactement ce qui l'interdit dans un scope `'use cache'` : Next.js
 * 16 y refuse la lecture des cookies. Pour une lecture publique mise en cache,
 * utiliser `createPublicClient()`.
 */
export async function createServerClient() {
  const { url, anonKey } = requireSupabaseEnv();

  // `await` obligatoire en Next.js 16 : `cookies()` renvoie une Promesse.
  const cookieStore = await cookies();

  return createSSRClient<Database>(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (list) => {
        try {
          list.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          /*
           * Appelé depuis un Server Component : Next.js interdit d'y écrire un
           * cookie, la réponse étant déjà en cours de rendu.
           *
           * Ce n'est pas une erreur à corriger et le `catch` vide est
           * volontaire : le rafraîchissement du jeton est assuré par `proxy.ts`,
           * qui s'exécute avant le rendu et peut, lui, écrire les cookies.
           * Sans ce filet, toute page du dashboard planterait au moment où
           * Supabase décide de renouveler le jeton.
           */
        }
      },
    },
  });
}
