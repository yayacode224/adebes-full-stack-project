import type { IdentitySettings } from "../../cms/entities/site-settings";
import type { SettingsDeps } from "../../cms/ports/settings.port";
import { ok, type Result } from "../../shared/result";

/**
 * Modifie l'identité de l'association.
 *
 * Aucune normalisation : contrairement à `contact` et `legal`, aucun champ de
 * ce groupe n'admet le marqueur `SETTINGS_TODO_MARKER` — les huit informations
 * sont déjà connues (voir `site-settings.ts`). Le cas d'usage se réduit donc à
 * un passe-plat vers le dépôt, gardé malgré tout pour que la page n'appelle
 * jamais un repository directement (§4 du Rapport 1).
 */
export async function updateIdentitySettings(
  deps: SettingsDeps,
  input: IdentitySettings,
  updatedBy: string | null,
): Promise<Result<IdentitySettings>> {
  return ok(await deps.write.updateIdentity(input, updatedBy));
}
