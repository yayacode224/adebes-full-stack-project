import type { SeoSettings } from "../../cms/entities/site-settings";
import type { SettingsDeps } from "../../cms/ports/settings.port";
import { ok, type Result } from "../../shared/result";

/**
 * Modifie les réglages de référencement.
 *
 * Passe-plat, comme `update-identity-settings.ts` : aucun champ de ce groupe
 * n'admet le marqueur `SETTINGS_TODO_MARKER`, et `keywords[]` est déjà une
 * liste de chaînes non vides bornée par le schéma.
 */
export async function updateSeoSettings(
  deps: SettingsDeps,
  input: SeoSettings,
  updatedBy: string | null,
): Promise<Result<SeoSettings>> {
  return ok(await deps.write.updateSeo(input, updatedBy));
}
