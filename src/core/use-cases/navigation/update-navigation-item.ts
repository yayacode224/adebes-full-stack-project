import type {
  NavigationItem,
  UpdateNavigationItem,
} from "../../cms/entities/navigation-item";
import type { NavigationDeps } from "../../cms/ports/navigation.port";
import { ok, type Result } from "../../shared/result";

/**
 * Modifie une entrée de navigation.
 *
 * `menu` n'est pas modifiable (absent du type `UpdateNavigationItem` comme du
 * schéma) : voir l'avertissement de `navigation-item.ts`.
 *
 * `isVisible` reste modifiable ICI, à la différence de `updateCoreValue`
 * (§8E), qui la neutralise pour la confier à un cas d'usage dédié
 * (`setCoreValueVisibility`). La distinction n'a pas la même portée sur cette
 * collection : masquer une valeur retire une section de DEUX pages publiques
 * et mérite sa propre entrée d'audit ; masquer une entrée de menu est un
 * réglage de présentation parmi d'autres sur la même fiche. `setVisibility`
 * existe malgré tout sur le port, pour le geste rapide « Afficher »/« Masquer »
 * depuis la liste, sans ouvrir la fiche.
 */
export async function updateNavigationItem(
  deps: NavigationDeps,
  id: string,
  input: UpdateNavigationItem,
): Promise<Result<NavigationItem>> {
  const champs: UpdateNavigationItem = { ...input };
  if (champs.description !== undefined) {
    champs.description = champs.description?.trim() || null;
  }

  return ok(await deps.write.update(id, champs));
}
