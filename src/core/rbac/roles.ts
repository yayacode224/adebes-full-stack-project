/**
 * Rôles et acteur courant.
 *
 * Trois rôles seulement, alignés sur l'énuméré PostgreSQL `public.user_role`
 * (migration 0001). Ajouter un rôle impose de toucher les deux — c'est
 * volontaire : un rôle qui existe en base sans permissions applicatives serait
 * un compte sans droits, et l'inverse un compte sans protection RLS.
 */

export const USER_ROLES = ["super_admin", "admin", "editor"] as const;

export type UserRole = (typeof USER_ROLES)[number];

export function isUserRole(valeur: unknown): valeur is UserRole {
  return (
    typeof valeur === "string" && (USER_ROLES as readonly string[]).includes(valeur)
  );
}

/**
 * L'utilisateur tel que le code d'autorisation le connaît.
 *
 * Volontairement minimal : tout ce qui n'entre pas dans une décision
 * d'autorisation n'a pas sa place ici. En particulier, `Actor` ne porte pas
 * de jeton — un jeton n'est pas une identité, et le faire circuler
 * inviterait à l'utiliser hors du chemin prévu.
 *
 * ⚠️  `isActive` n'est pas décoratif. Il est relu **en base** à chaque requête
 * par `getCurrentActor()` : désactiver un compte doit le déconnecter à la
 * requête suivante, sans attendre l'expiration de son jeton.
 */
export type Actor = {
  id: string;
  email: string;
  fullName: string | null;
  role: UserRole;
  isActive: boolean;
  avatarMediaId: string | null;
};

/** Libellés d'interface. Le code manipule le rôle, l'utilisateur lit ceci. */
export const ROLE_LABELS: Record<UserRole, string> = {
  super_admin: "Super administrateur",
  admin: "Administrateur",
  editor: "Éditeur",
};

/** Explication affichée dans l'écran d'invitation (Lot 13). */
export const ROLE_DESCRIPTIONS: Record<UserRole, string> = {
  super_admin:
    "Tous les droits, y compris la gestion des comptes et des rôles.",
  admin:
    "Gère le contenu, les réglages et la publication. Ne peut pas modifier les rôles.",
  editor:
    "Rédige et modifie le contenu. Ne peut ni publier, ni supprimer, ni accéder aux réglages.",
};
