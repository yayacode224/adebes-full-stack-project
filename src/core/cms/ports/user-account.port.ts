import type { UserRole } from "../../rbac/roles";
import type { UserAccount } from "../entities/user-account";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PORTS DE L'ANNUAIRE DES COMPTES (§13.1 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Même découpage lecture / écriture que le reste du projet. L'écran
 * `/dashboard/utilisateurs` reçoit un `UserAccountReadPort` ; seules les Server
 * Actions reçoivent le port d'écriture.
 *
 * ---------------------------------------------------------------------------
 * `countActiveSuperAdmins` VIT DANS LE PORT DE LECTURE, ET C'EST VOULU
 * ---------------------------------------------------------------------------
 * Le dernier super administrateur actif est protégé EN BASE (trigger
 * `guard_last_super_admin`, migration 0010). Mais `auth.admin.deleteUser` avale
 * le message du trigger et renvoie un « 500 Database error » opaque (constaté au
 * Lot 1). Les cas d'usage comptent donc les super administrateurs actifs AVANT
 * d'agir, pour afficher la phrase de la base plutôt que l'erreur d'API. La base
 * reste l'autorité ; ce compte n'est là que pour un meilleur message.
 */

export interface UserAccountReadPort {
  /** Tous les comptes, du plus récent au plus ancien. */
  list(): Promise<UserAccount[]>;

  /** Un compte précis. `null` s'il n'existe pas. */
  findById(id: string): Promise<UserAccount | null>;

  /** Nombre de comptes `super_admin` actifs — pour les garde-fous du §13.2. */
  countActiveSuperAdmins(): Promise<number>;
}

export interface UserAccountWritePort {
  /**
   * Invite une adresse et lui attribue un rôle.
   *
   * Envoie l'e-mail d'invitation (`auth.admin.inviteUserByEmail`) puis écrit le
   * rôle choisi dans `profiles` — le trigger `handle_new_user` a créé la ligne
   * avec le rôle `editor` par défaut. Renvoie le compte tel qu'il est ensuite.
   */
  invite(input: {
    email: string;
    fullName: string;
    role: UserRole;
  }): Promise<UserAccount>;

  /** Change le rôle d'un compte. */
  setRole(id: string, role: UserRole): Promise<UserAccount>;

  /** Active ou désactive un compte. */
  setActive(id: string, isActive: boolean): Promise<UserAccount>;

  /**
   * Supprime un compte, identité comprise (`auth.admin.deleteUser`, qui
   * cascade sur `profiles`).
   */
  remove(id: string): Promise<void>;
}

export type UserAccountDeps = {
  read: UserAccountReadPort;
  write: UserAccountWritePort;
};
