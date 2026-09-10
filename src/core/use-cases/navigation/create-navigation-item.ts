import type {
  CreateNavigationItem,
  NavigationItem,
} from "../../cms/entities/navigation-item";
import type { NavigationDeps } from "../../cms/ports/navigation.port";
import { ok, type Result } from "../../shared/result";

/**
 * Crée une entrée de navigation, en fin du menu qu'elle rejoint.
 *
 * `count()` n'existe pas sur `NavigationReadPort` (§ce fichier n'en a pas
 * besoin d'un générique) : la longueur de `findByMenu(input.menu)` suffit, et
 * c'est la même quantité — les positions sont renumérotées de 1 à N à chaque
 * réordonnancement, comme aux collections du Lot 8.
 *
 * `isVisible` naît à `true` : une entrée qu'on vient d'ajouter à un menu est,
 * par définition, une entrée qu'on veut y voir (même raisonnement que
 * `createCoreValue`, §8E). `description` vide est ramenée à `null` — voir le
 * mapper pour la raison (distinguer « aucune aide » de « aide vide »).
 */
export async function createNavigationItem(
  deps: NavigationDeps,
  input: CreateNavigationItem,
): Promise<Result<NavigationItem>> {
  const existantes = await deps.read.findByMenu(input.menu);
  const position = input.position ?? existantes.length + 1;

  return ok(
    await deps.write.create({
      ...input,
      description: input.description?.trim() || null,
      position,
      isExternal: input.isExternal ?? false,
      isVisible: input.isVisible ?? true,
      parentId: input.parentId ?? null,
    }),
  );
}
