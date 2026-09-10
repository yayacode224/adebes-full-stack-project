import type { NavigationDeps } from "../../cms/ports/navigation.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime une entrée de navigation, et renumérote le menu qu'elle quitte.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA RENUMÉROTATION EST BORNÉE AU MENU DE L'ENTRÉE SUPPRIMÉE
 * ---------------------------------------------------------------------------
 * Même piège que `deleteCoreValue` (§8E) — les positions doivent rester
 * 1..N sans trou, sous peine de collision au prochain `create` — mais réglé
 * ici par menu : `findByMenu(existante.menu)` après suppression, jamais
 * `findAll()`. Renuméroter toute la table mélangerait les quatre séquences de
 * positions indépendantes que porte `navigation_items` (voir
 * `navigation-item.ts`).
 *
 * Une entrée de navigation ne référence rien et n'est référencée par rien
 * d'autre qu'elle-même (`parent_id`, `on delete cascade` — sans portée ici,
 * aucune sous-entrée n'existe) : pas d'archive, suppression définitive, comme
 * `core_values`.
 */
export async function deleteNavigationItem(
  deps: NavigationDeps,
  id: string,
): Promise<Result<void>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette entrée n'existe plus."));
  }

  await deps.write.delete(id);

  const restantes = await deps.read.findByMenu(existante.menu);
  if (restantes.length > 0) {
    await deps.write.reorder(restantes.map((entree) => entree.id));
  }

  return ok(undefined);
}
