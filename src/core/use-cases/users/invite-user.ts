import type { UserAccountDeps } from "../../cms/ports/user-account.port";
import type { InviteUserInput } from "../../cms/schemas/user-account.schema";
import type { UserAccount } from "../../cms/entities/user-account";
import { ok, type Result } from "../../shared/result";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  INVITER UN COMPTE (§13.1 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « L'invitation utilise `supabase.auth.admin.inviteUserByEmail()`. Le rôle
 * choisi est écrit dans `profiles` juste après. »
 *
 * Aucune permission vérifiée ici — c'est le rôle de `createAction`
 * (`user:create`, ouvert à l'administrateur). Aucun garde-fou du §13.2 non
 * plus : inviter ne touche à aucun compte existant. Le cas d'usage se contente
 * de déléguer au port, qui envoie l'e-mail puis pose le rôle.
 *
 * `invitedBy` n'est pas utilisé par le cas d'usage lui-même : l'auteur de
 * l'invitation est journalisé par `createAction` (`audit.action = 'user.invite'`,
 * `actor` = celui qui appelle). Le paramètre est conservé dans la signature
 * pour rester homogène avec les autres cas d'usage de comptes.
 */
export async function inviteUser(
  deps: UserAccountDeps,
  input: InviteUserInput,
): Promise<Result<UserAccount>> {
  const compte = await deps.write.invite({
    email: input.email,
    fullName: input.fullName,
    role: input.role,
  });

  return ok(compte);
}
