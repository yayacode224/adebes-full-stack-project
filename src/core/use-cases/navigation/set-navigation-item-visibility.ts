import type { NavigationItem } from "../../cms/entities/navigation-item";
import type { NavigationDeps } from "../../cms/ports/navigation.port";
import { ok, type Result } from "../../shared/result";

/**
 * Affiche ou retire une entrée d'un menu, sans ouvrir sa fiche.
 *
 * Distinct de `updateNavigationItem` pour le geste rapide depuis la liste —
 * même utilité que `changerVisibiliteValeurAction` (§8E), portée plus légère :
 * voir `update-navigation-item.ts` pour la différence avec les collections à
 * cycle éditorial.
 */
export async function setNavigationItemVisibility(
  deps: NavigationDeps,
  input: { id: string; isVisible: boolean },
): Promise<Result<NavigationItem>> {
  return ok(await deps.write.setVisibility(input.id, input.isVisible));
}
