/**
 * Le point de décision unique des autorisations.
 *
 * ⚠️  RÈGLE ABSOLUE DU PROJET (décision D6) : le code ne teste JAMAIS
 * `actor.role === "admin"`. Il teste `can(actor, "programme:publish")`.
 *
 * Un test de rôle disséminé dans soixante fichiers rend tout changement de
 * politique impossible à auditer : il faut relire soixante fichiers pour
 * savoir qui peut publier. Ici, la réponse est dans `permissions.ts`, et
 * elle se relit en trente secondes.
 *
 * Corollaire : si vous vous surprenez à écrire une comparaison de rôle
 * ailleurs que dans ce dossier, c'est qu'il manque une permission dans la
 * matrice.
 */

import { AppError } from "../shared/errors";
import { ROLE_PERMISSIONS, type Permission } from "./permissions";
import type { Actor } from "./roles";

/**
 * L'acteur possède-t-il cette permission ?
 *
 * Deux refus avant même de consulter la matrice :
 *
 *   * `actor` absent — personne n'est connecté ;
 *   * `isActive` faux — le compte a été désactivé. Le jeton de session peut
 *     encore être valide plusieurs minutes ; c'est cette ligne qui rend la
 *     désactivation effective à la requête suivante.
 */
export function can(actor: Actor | null | undefined, permission: Permission): boolean {
  if (!actor || !actor.isActive) return false;
  return ROLE_PERMISSIONS[actor.role].includes(permission);
}

/** Toutes les permissions demandées sont-elles accordées ? */
export function canAll(
  actor: Actor | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.every((permission) => can(actor, permission));
}

/** Au moins une des permissions demandées est-elle accordée ? */
export function canAny(
  actor: Actor | null | undefined,
  permissions: readonly Permission[],
): boolean {
  return permissions.some((permission) => can(actor, permission));
}

/**
 * Même décision, mais en levant une erreur.
 *
 * Distingue volontairement les deux refus, parce que l'utilisateur n'a pas la
 * même chose à faire dans un cas et dans l'autre :
 *
 *   * non connecté  → on l'envoie se connecter ;
 *   * connecté sans droits → se reconnecter n'y changera rien, il faut demander
 *     un accès à un administrateur.
 *
 * Un message unique « accès refusé » enverrait la moitié des utilisateurs
 * tourner en rond sur l'écran de connexion.
 */
export function assertCan(
  actor: Actor | null | undefined,
  permission: Permission,
): asserts actor is Actor {
  if (!actor) {
    throw new AppError(
      "UNAUTHENTICATED",
      "Vous devez être connecté pour effectuer cette action.",
    );
  }
  if (!actor.isActive) {
    throw new AppError(
      "FORBIDDEN",
      "Votre accès a été désactivé. Contactez un administrateur.",
    );
  }
  if (!can(actor, permission)) {
    throw new AppError(
      "FORBIDDEN",
      "Vous n'avez pas les droits nécessaires pour cette action.",
    );
  }
}

/**
 * Toutes les permissions d'un acteur.
 *
 * Sert au filtrage de la navigation du dashboard (Lot 5) : une entrée dont
 * l'utilisateur n'a pas la permission `read` n'est pas rendue du tout — ni
 * grisée, ni masquée en CSS.
 */
export function permissionsOf(actor: Actor | null | undefined): readonly Permission[] {
  if (!actor || !actor.isActive) return [];
  return ROLE_PERMISSIONS[actor.role];
}
