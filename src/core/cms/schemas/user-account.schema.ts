import { z } from "zod";

import { USER_ROLES } from "../../rbac/roles";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE LA GESTION DES COMPTES (§13.1 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Quatre entrées venues du client : inviter, changer le rôle, activer /
 * désactiver, supprimer. Chacune rejouée côté serveur par `createAction`.
 *
 * Les garde-fous du §13.2 (« pas son propre rôle », « pas se désactiver »,
 * « dernier super administrateur ») ne sont PAS ici : ils dépendent de
 * l'identité de l'appelant, que le schéma ne connaît pas. Ils vivent dans les
 * cas d'usage, doublés par le trigger `guard_last_super_admin` en base.
 */

/** Rôle attribuable. `z.enum` sur la liste unique de `core/rbac/roles.ts`. */
const roleSchema = z.enum(USER_ROLES, {
  message: "Choisissez un rôle dans la liste.",
});

export const inviteUserSchema = z.object(
  {
    // Normaliser AVANT de valider : une adresse copiée-collée arrive souvent
    // avec une espace ou une majuscule. On trim/minuscule d'abord, puis
    // `z.email` se prononce sur la valeur propre.
    email: z
      .string()
      .trim()
      .toLowerCase()
      .pipe(
        z
          .email("Cette adresse e-mail ne semble pas valide.")
          .max(254, "Cette adresse e-mail est trop longue."),
      ),
    fullName: z
      .string()
      .trim()
      .min(2, "Indiquez le nom de la personne (au moins 2 caractères).")
      .max(120, "Ce nom est trop long (120 caractères maximum)."),
    role: roleSchema,
  },
  { message: "Formulaire d'invitation invalide." },
);

export const changeUserRoleSchema = z.object(
  {
    userId: z.uuid("Compte introuvable."),
    role: roleSchema,
  },
  { message: "Demande de changement de rôle invalide." },
);

export const setUserActiveSchema = z.object(
  {
    userId: z.uuid("Compte introuvable."),
    isActive: z.boolean({ message: "État d'activité invalide." }),
  },
  { message: "Demande de changement d'état invalide." },
);

export const userIdSchema = z.object(
  { userId: z.uuid("Compte introuvable.") },
  { message: "Compte introuvable." },
);

export type InviteUserInput = z.infer<typeof inviteUserSchema>;
export type ChangeUserRoleInput = z.infer<typeof changeUserRoleSchema>;
export type SetUserActiveInput = z.infer<typeof setUserActiveSchema>;
export type UserIdInput = z.infer<typeof userIdSchema>;
