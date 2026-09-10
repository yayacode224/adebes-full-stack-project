import "server-only";

import type { SettingsDeps, SettingsReadPort } from "@/core/cms/ports/settings.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseSettingsRepository } from "@/infrastructure/supabase/repositories/settings.repository";

/**
 * Composition des dépendances des réglages. Gabarit de `core-value.deps.ts`
 * (§8E) : le client est reconstruit à chaque appel (cookies de la requête en
 * cours), un seul dépôt suffit (`site_settings` n'a aucune clé étrangère
 * sortante côté domaine).
 *
 * Non importable depuis `src/server/queries/` — ce fichier tire
 * `clients/server`, donc `next/headers` (garde-fou ESLint nº 2). La lecture
 * publique compose son propre dépôt avec `createPublicClient()`, dans
 * `server/queries/settings.query.ts`.
 */
export async function settingsDeps(): Promise<SettingsDeps> {
  const reglages = new SupabaseSettingsRepository(await createServerClient());
  return { read: reglages, write: reglages };
}

/** Le port de LECTURE seul — pour les pages du dashboard qui n'écrivent pas. */
export async function settingsReadPort(): Promise<SettingsReadPort> {
  return new SupabaseSettingsRepository(await createServerClient());
}
