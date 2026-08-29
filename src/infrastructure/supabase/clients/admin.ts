import "server-only";

import { createClient } from "@supabase/supabase-js";

import type { Database } from "../database.types";
import { requireServiceRoleKey, requireSupabaseEnv } from "./env";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CLIENT ADMINISTRATEUR — CONTOURNE TOUTES LES POLITIQUES RLS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *  ⚠️  CE CLIENT N'EST SOUMIS À AUCUNE SÉCURITÉ DE BASE DE DONNÉES.
 *
 *  La clé `service_role` ignore la RLS. Toute requête émise ici voit et modifie
 *  l'intégralité des données, y compris les brouillons, les messages reçus et
 *  les profils. La seule protection est le code qui l'entoure.
 *
 * ---------------------------------------------------------------------------
 * LES QUATRE SEULS USAGES AUTORISÉS (§3.1 du Rapport 2)
 * ---------------------------------------------------------------------------
 *   1. Invitation d'un utilisateur   (`auth.admin.inviteUserByEmail`)
 *   2. Suppression d'un utilisateur  (`auth.admin.deleteUser`)
 *   3. Écriture du journal d'audit   (aucune politique d'insert n'existe —
 *      un journal que l'application peut modifier ne prouve rien)
 *   4. Script de seed
 *
 * Cette liste ne s'étend pas sans décision explicite. Si vous avez besoin de
 * ce client pour autre chose, la vraie question est presque toujours
 * « quelle politique RLS manque-t-il ? ».
 *
 * ---------------------------------------------------------------------------
 * `import "server-only"` EN PREMIÈRE LIGNE
 * ---------------------------------------------------------------------------
 * Ce n'est pas décoratif : ce paquet fait ÉCHOUER LE BUILD si ce module est
 * atteint depuis un composant client. Sans lui, un `import` malencontreux
 * expédierait la clé `service_role` dans le bundle du navigateur — c'est-à-dire
 * la remettrait à tout visiteur du site.
 *
 * La recette du Lot 16 vérifie que `grep -r "service_role" .next/static/` ne
 * renvoie rien. Cette ligne est ce qui le garantit à la compilation, sans
 * attendre la recette.
 */
export function createAdminClient() {
  const { url } = requireSupabaseEnv();

  return createClient<Database>(url, requireServiceRoleKey(), {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false,
    },
  });
}
