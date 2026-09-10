import type { UserAccountReadPort } from "../../cms/ports/user-account.port";
import type { UserAccount } from "../../cms/entities/user-account";
import { ok, type Result } from "../../shared/result";

/**
 * L'annuaire complet, du compte le plus récent au plus ancien.
 *
 * La lecture ne peut échouer qu'en cas de panne — remontée en exception à
 * `createAction` / à la page. Une liste vide est un état valide (jamais atteint
 * en pratique : il y a toujours au moins le super administrateur du seed).
 */
export async function listUserAccounts(
  read: UserAccountReadPort,
): Promise<Result<UserAccount[]>> {
  return ok(await read.list());
}
