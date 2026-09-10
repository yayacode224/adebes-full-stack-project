import type { NavigationMenu } from "../../cms/entities/navigation-item";
import type { NavigationDeps } from "../../cms/ports/navigation.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Réordonne UN menu.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️  LA VÉRIFICATION D'APPARTENANCE EST VITALE — GABARIT DE `reorderSections`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `reorder_rows()` (§3.4) renumérote par identifiants, sans notion de menu.
 * `navigation_items` porte QUATRE séquences de positions indépendantes
 * (`main`, `conversion`, `legal`, `footer` — index `(menu, position)`,
 * migration 0007). Une liste mêlant deux menus renumérotrait les deux, en
 * silence : le menu voisin se retrouverait réordonné par quelqu'un qui n'a
 * jamais ouvert son onglet, sans qu'aucune erreur SQL ne le signale.
 *
 * Le contrôle ci-dessous — appartenance ET exhaustivité — est donc obligatoire
 * ici, exactement comme au Lot 9 pour les sections d'une page.
 */
export async function reorderNavigationItems(
  deps: NavigationDeps,
  input: { menu: NavigationMenu; orderedIds: string[] },
): Promise<Result<void>> {
  if (new Set(input.orderedIds).size !== input.orderedIds.length) {
    return err(
      new AppError("VALIDATION", "La liste contient deux fois la même entrée."),
    );
  }

  const connues = await deps.read.findByMenu(input.menu);
  const idsConnus = new Set(connues.map((entree) => entree.id));

  if (input.orderedIds.some((id) => !idsConnus.has(id))) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste contient une entrée qui n'appartient pas à ce menu.",
      ),
    );
  }

  if (input.orderedIds.length !== connues.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste doit contenir toutes les entrées de ce menu.",
      ),
    );
  }

  await deps.write.reorder(input.orderedIds);
  return ok(undefined);
}
