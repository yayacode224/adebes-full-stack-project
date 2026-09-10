import type { UserAccountDeps } from "../../cms/ports/user-account.port";
import type { UserAccount } from "../../cms/entities/user-account";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

import { refuseSiDernierSuperAdmin } from "./guards";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ACTIVER / DÉSACTIVER UN COMPTE (§13.1 / §13.2 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Réservé au super administrateur (`createAction` → `user:update`). Garde-fous
 * du §13.2 traités ici :
 *
 *   • « Impossible de se désactiver soi-même. »
 *   • Le dernier super administrateur actif ne peut pas être désactivé
 *     (doublé en base par `guard_last_super_admin`).
 *
 * « Désactiver un compte invalide ses sessions à la prochaine requête » : c'est
 * `getCurrentActor` qui l'assure — il relit `is_active` en base à chaque rendu
 * (DAL, Lot 4). Rien à faire de plus ici que d'écrire l'état.
 */
export async function setUserActive(
  deps: UserAccountDeps,
  entree: { actorId: string; targetId: string; isActive: boolean },
): Promise<Result<{ account: UserAccount }>> {
  if (entree.targetId === entree.actorId && !entree.isActive) {
    return err(
      new AppError(
        "VALIDATION",
        "Vous ne pouvez pas désactiver votre propre compte.",
      ),
    );
  }

  const cible = await deps.read.findById(entree.targetId);
  if (!cible) {
    return err(new AppError("NOT_FOUND", "Ce compte n'existe plus."));
  }

  if (cible.isActive === entree.isActive) {
    return err(
      new AppError(
        "VALIDATION",
        entree.isActive
          ? "Ce compte est déjà actif."
          : "Ce compte est déjà désactivé.",
      ),
    );
  }

  if (!entree.isActive) {
    const refus = await refuseSiDernierSuperAdmin(deps.read, cible);
    if (refus) return err(refus);
  }

  const compte = await deps.write.setActive(entree.targetId, entree.isActive);
  return ok({ account: compte });
}
