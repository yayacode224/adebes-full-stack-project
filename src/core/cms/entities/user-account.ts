import type { UserRole } from "../../rbac/roles";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UN COMPTE, TEL QUE L'ÉCRAN `/dashboard/utilisateurs` LE MANIPULE (§13.1)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Distinct d'`Actor` (`core/rbac/roles.ts`), et volontairement : `Actor` est le
 * strict nécessaire à une décision d'autorisation — il ne porte ni date, ni
 * état d'activité affichable, ni horodatage. `UserAccount` est la vue de
 * l'annuaire : ce qu'un super administrateur lit et modifie dans la liste.
 *
 * L'identité vit dans `auth.users` (Supabase Auth) ; cette table-ci — `profiles`
 * — porte le rôle applicatif, l'état et le nom affiché. Aucune donnée
 * d'authentification (mot de passe, jeton) n'a sa place ici.
 */
export type UserAccount = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  /** Dernière connexion réussie, écrite par `signInAction`. `null` = jamais connecté. */
  lastSeenAt: string | null;
  avatarMediaId: string | null;
  createdAt: string;
};

/**
 * Un compte encore jamais connecté : invité, lien pas encore suivi.
 *
 * Sert à afficher « Invitation en attente » plutôt qu'un tiret dans la colonne
 * « Dernière connexion », qui laisserait croire à un défaut d'affichage.
 */
export function estInvitationEnAttente(compte: UserAccount): boolean {
  return compte.lastSeenAt === null;
}
