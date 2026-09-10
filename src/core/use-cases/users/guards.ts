import type { UserAccountReadPort } from "../../cms/ports/user-account.port";
import type { UserAccount } from "../../cms/entities/user-account";
import { AppError } from "../../shared/errors";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE GARDE-FOU DU DERNIER SUPER ADMINISTRATEUR (§13.2 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La vraie barrière est en base : le trigger `guard_last_super_admin` (0010)
 * refuse de rétrograder, désactiver ou supprimer le dernier `super_admin`
 * actif, sur `UPDATE` comme sur `DELETE`. Ce contrôle applicatif ne le
 * remplace pas — il le DOUBLE, pour deux raisons :
 *
 *   1. `auth.admin.deleteUser` avale le message du trigger et renvoie un
 *      « 500 Database error deleting user » opaque (constaté au Lot 1). Sans ce
 *      pré-contrôle, la suppression du dernier super administrateur afficherait
 *      une erreur technique au lieu de la phrase de la base.
 *   2. Afficher le refus AVANT d'agir évite un aller-retour et une invitation
 *      envoyée pour rien.
 *
 * La logique reproduit exactement celle du trigger : on compte les AUTRES
 * super administrateurs actifs (hors la cible, et hors elle-même si elle est
 * déjà inactive).
 */
export async function refuseSiDernierSuperAdmin(
  read: UserAccountReadPort,
  cible: UserAccount,
): Promise<AppError | null> {
  if (cible.role !== "super_admin") return null;

  const actifs = await read.countActiveSuperAdmins();
  const autres = actifs - (cible.isActive ? 1 : 0);

  if (autres > 0) return null;

  return new AppError(
    "CONFLICT",
    "Impossible : ce compte est le dernier super administrateur actif. " +
      "Nommez d'abord un autre super administrateur.",
  );
}
