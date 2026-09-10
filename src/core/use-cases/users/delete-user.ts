import type { UserAccountDeps } from "../../cms/ports/user-account.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

import { refuseSiDernierSuperAdmin } from "./guards";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SUPPRIMER UN COMPTE (§13.1 / §13.2 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Réservé au super administrateur (`createAction` → `user:delete`, absent des
 * permissions de l'administrateur).
 *
 * ---------------------------------------------------------------------------
 * LE PRÉ-CONTRÔLE DU DERNIER SUPER ADMINISTRATEUR EST ICI PLUS CRITIQUE
 * QU'AILLEURS
 * ---------------------------------------------------------------------------
 * Le trigger `guard_last_super_admin` protège aussi sur `DELETE`. Mais
 * `auth.admin.deleteUser` (GoTrue) n'expose pas le message du trigger : il
 * renvoie « 500 Database error deleting user ». Sans le contrôle applicatif,
 * l'utilisateur verrait une erreur technique là où la base dit une phrase
 * claire. On compte donc AVANT d'appeler l'API.
 *
 * Renvoie l'e-mail du compte supprimé — pour le journal (`user.delete`) et le
 * message de confirmation.
 */
export async function deleteUser(
  deps: UserAccountDeps,
  entree: { actorId: string; targetId: string },
): Promise<Result<{ id: string; email: string }>> {
  if (entree.targetId === entree.actorId) {
    return err(
      new AppError(
        "VALIDATION",
        "Vous ne pouvez pas supprimer votre propre compte.",
      ),
    );
  }

  const cible = await deps.read.findById(entree.targetId);
  if (!cible) {
    return err(new AppError("NOT_FOUND", "Ce compte n'existe plus."));
  }

  const refus = await refuseSiDernierSuperAdmin(deps.read, cible);
  if (refus) return err(refus);

  await deps.write.remove(entree.targetId);
  return ok({ id: cible.id, email: cible.email });
}
