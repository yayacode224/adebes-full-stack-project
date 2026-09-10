import type { UserAccountDeps } from "../../cms/ports/user-account.port";
import type { UserAccount } from "../../cms/entities/user-account";
import type { UserRole } from "../../rbac/roles";
import { ROLE_LABELS } from "../../rbac/roles";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

import { refuseSiDernierSuperAdmin } from "./guards";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  CHANGER LE RÔLE D'UN COMPTE (§13.1 / §13.2 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Réservé au super administrateur — vérifié par `createAction` (`user:update`,
 * absent des permissions de l'administrateur). Ici : les deux garde-fous du
 * §13.2 qui dépendent de l'identité de l'appelant.
 *
 *   • « Impossible de modifier son propre rôle. »
 *   • Le dernier super administrateur actif ne peut pas être rétrogradé
 *     (doublé en base par `guard_last_super_admin`, message repris).
 *
 * Renvoie le compte ET son rôle précédent : le journal d'audit inscrit le
 * différentiel `{ de, vers }`.
 */
export async function changeUserRole(
  deps: UserAccountDeps,
  entree: { actorId: string; targetId: string; role: UserRole },
): Promise<Result<{ account: UserAccount; previousRole: UserRole }>> {
  if (entree.targetId === entree.actorId) {
    return err(
      new AppError(
        "VALIDATION",
        "Vous ne pouvez pas modifier votre propre rôle. Demandez à un autre super administrateur.",
      ),
    );
  }

  const cible = await deps.read.findById(entree.targetId);
  if (!cible) {
    return err(new AppError("NOT_FOUND", "Ce compte n'existe plus."));
  }

  if (cible.role === entree.role) {
    return err(
      new AppError(
        "VALIDATION",
        `Ce compte a déjà le rôle « ${ROLE_LABELS[entree.role]} ».`,
      ),
    );
  }

  // Rétrogradation d'un super administrateur : contrôle du dernier actif.
  if (cible.role === "super_admin" && entree.role !== "super_admin") {
    const refus = await refuseSiDernierSuperAdmin(deps.read, cible);
    if (refus) return err(refus);
  }

  const compte = await deps.write.setRole(entree.targetId, entree.role);
  return ok({ account: compte, previousRole: cible.role });
}
