import "server-only";

import type {
  UserAccountDeps,
  UserAccountReadPort,
} from "@/core/cms/ports/user-account.port";
import { createAdminClient } from "@/infrastructure/supabase/clients/admin";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseUserAccountRepository } from "@/infrastructure/supabase/repositories/user-account.repository";

/**
 * Composition des dépendances de l'annuaire des comptes (§13.1).
 *
 * Le dépôt reçoit DEUX clients : celui de la session (soumis à la RLS, pour
 * lire l'annuaire et écrire rôle / état) et celui d'administration (pour
 * inviter et supprimer — les deux opérations qui touchent `auth.users`). Voir
 * l'en-tête du dépôt.
 *
 * Non importable depuis `src/server/queries/` : tire `clients/server`
 * (`next/headers`) ET `clients/admin`. L'annuaire n'a de toute façon aucune
 * lecture publique.
 */
export async function userAccountDeps(): Promise<UserAccountDeps> {
  const repo = new SupabaseUserAccountRepository(
    await createServerClient(),
    createAdminClient(),
  );
  return { read: repo, write: repo };
}

/** Le port de LECTURE seul — pour les pages du dashboard qui n'écrivent pas. */
export async function userAccountReadPort(): Promise<UserAccountReadPort> {
  return new SupabaseUserAccountRepository(
    await createServerClient(),
    createAdminClient(),
  );
}
