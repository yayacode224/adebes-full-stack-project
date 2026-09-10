import "server-only";

import type {
  NavigationDeps,
  NavigationReadPort,
} from "@/core/cms/ports/navigation.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseNavigationRepository } from "@/infrastructure/supabase/repositories/navigation.repository";

/** Composition des dépendances de la navigation. Gabarit de `core-value.deps.ts`. */
export async function navigationDeps(): Promise<NavigationDeps> {
  const navigation = new SupabaseNavigationRepository(await createServerClient());
  return { read: navigation, write: navigation };
}

/** Le port de LECTURE seul — pour les pages du dashboard qui n'écrivent pas. */
export async function navigationReadPort(): Promise<NavigationReadPort> {
  return new SupabaseNavigationRepository(await createServerClient());
}
