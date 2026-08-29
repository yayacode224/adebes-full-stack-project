import { createBrowserClient as createSSRBrowserClient } from "@supabase/ssr";

import type { Database } from "../database.types";
import { requireSupabaseEnv } from "./env";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CLIENT NAVIGATEUR
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  USAGE AUTORISÉ    Client Components ayant besoin de Supabase dans le
 *                    navigateur — et il y en a peu.
 *
 *  INTERDIT          Côté serveur. Utiliser `createServerClient()`.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI SON USAGE DOIT RESTER RARE
 * ---------------------------------------------------------------------------
 * L'architecture fait passer les lectures par `src/server/queries/` et les
 * écritures par des Server Actions (décision D3). Une requête émise depuis le
 * navigateur court-circuite les deux : elle échappe au décorateur
 * `createAction`, donc à la vérification de permission, à la validation
 * d'entrée, au journal d'audit et à l'invalidation de cache.
 *
 * Il ne reste alors que la RLS pour protéger — c'est-à-dire la dernière
 * barrière, employée comme si c'était la seule.
 *
 * Les deux usages légitimes prévus :
 *   * la déconnexion (`auth.signOut()`), qui doit effacer les cookies côté
 *     navigateur ;
 *   * l'abonnement temps réel, si le Lot 14 en introduit un pour le compteur
 *     de messages non lus.
 *
 * Pour tout le reste, la question à se poser est : « pourquoi cette lecture
 * n'est-elle pas dans `src/server/queries/` ? »
 */
export function createBrowserClient() {
  const { url, anonKey } = requireSupabaseEnv();
  return createSSRBrowserClient<Database>(url, anonKey);
}
