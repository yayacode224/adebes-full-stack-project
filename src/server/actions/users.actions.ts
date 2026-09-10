"use server";

import type { UserAccount } from "@/core/cms/entities/user-account";
import {
  changeUserRoleSchema,
  inviteUserSchema,
  setUserActiveSchema,
  userIdSchema,
} from "@/core/cms/schemas/user-account.schema";
import type { UserRole } from "@/core/rbac/roles";
import { errors } from "@/core/shared/errors";
import { err } from "@/core/shared/result";
import { changeUserRole } from "@/core/use-cases/users/change-user-role";
import { deleteUser } from "@/core/use-cases/users/delete-user";
import { inviteUser } from "@/core/use-cases/users/invite-user";
import { setUserActive } from "@/core/use-cases/users/set-user-active";

import { createAction } from "../action-kit/create-action";
import { userAccountDeps } from "../deps/user-account.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DE LA GESTION DES COMPTES (§13.1 / §13.2 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Quatre actions, toutes dans `createAction`. Le partage des permissions suit
 * la matrice du §9 à la lettre :
 *
 *   • inviter            → `user:create`  (administrateur inclus)
 *   • changer le rôle    → `user:update`  (super administrateur SEUL)
 *   • activer/désactiver → `user:update`  (super administrateur SEUL)
 *   • supprimer          → `user:delete`  (super administrateur SEUL)
 *
 * `user:update` et `user:delete` sont absents des permissions de
 * l'administrateur (`core/rbac/permissions.ts`) : c'est la règle « un compte ne
 * peut pas s'attribuer une permission qu'il n'a pas ». La RLS le double
 * (`profiles_super_admin_update` / `profiles_super_admin_delete`), et le trigger
 * `guard_last_super_admin` protège le dernier super administrateur même si tout
 * le reste était contourné.
 *
 * Les garde-fous « pas son propre rôle » / « pas se désactiver soi-même »
 * dépendent de l'identité de l'appelant : ils vivent dans les cas d'usage, qui
 * reçoivent `actor.id`.
 */

export const inviterUtilisateurAction = createAction<
  typeof inviteUserSchema,
  UserAccount
>({
  permission: "user:create",
  input: inviteUserSchema,
  audit: {
    action: "user.invite",
    entityType: "user",
    entityId: (compte) => compte.id,
    diff: (compte) => ({
      email: compte.email,
      nom: compte.fullName,
      role: compte.role,
    }),
  },
  handler: async ({ input }) => inviteUser(await userAccountDeps(), input),
});

export const changerRoleUtilisateurAction = createAction<
  typeof changeUserRoleSchema,
  { account: UserAccount; previousRole: UserRole }
>({
  permission: "user:update",
  input: changeUserRoleSchema,
  audit: {
    action: "user.role_changed",
    entityType: "user",
    entityId: (resultat) => resultat.account.id,
    diff: (resultat) => ({
      de: resultat.previousRole,
      vers: resultat.account.role,
    }),
  },
  handler: async ({ input, actor }) => {
    if (!actor) return err(errors.unauthenticated());
    return changeUserRole(await userAccountDeps(), {
      actorId: actor.id,
      targetId: input.userId,
      role: input.role,
    });
  },
});

export const changerActivationUtilisateurAction = createAction<
  typeof setUserActiveSchema,
  { account: UserAccount }
>({
  permission: "user:update",
  input: setUserActiveSchema,
  audit: {
    action: "user.activation",
    entityType: "user",
    entityId: (resultat) => resultat.account.id,
    diff: (resultat) => ({ actif: resultat.account.isActive }),
  },
  handler: async ({ input, actor }) => {
    if (!actor) return err(errors.unauthenticated());
    return setUserActive(await userAccountDeps(), {
      actorId: actor.id,
      targetId: input.userId,
      isActive: input.isActive,
    });
  },
});

export const supprimerUtilisateurAction = createAction<
  typeof userIdSchema,
  { id: string; email: string }
>({
  permission: "user:delete",
  input: userIdSchema,
  audit: {
    action: "user.delete",
    entityType: "user",
    entityId: (resultat) => resultat.id,
    diff: (resultat) => ({ email: resultat.email }),
  },
  handler: async ({ input, actor }) => {
    if (!actor) return err(errors.unauthenticated());
    return deleteUser(await userAccountDeps(), {
      actorId: actor.id,
      targetId: input.userId,
    });
  },
});
