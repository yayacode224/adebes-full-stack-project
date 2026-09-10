import type { ThemeSettings } from "../../cms/entities/theme-settings";
import type { SettingsDeps } from "../../cms/ports/settings.port";
import { ok, type Result } from "../../shared/result";

/**
 * Modifie le thème du site (§11 du Rapport 2).
 *
 * Passe-plat, comme `update-seo-settings.ts` : aucun champ n'admet le marqueur
 * `SETTINGS_TODO_MARKER` (une couleur ou une police n'est jamais « à
 * compléter »), l'assainissement des couleurs et la vérification de contraste
 * sont deux affaires de `theme.schema.ts`, rejouées par `createAction` avant
 * que ce cas d'usage ne s'exécute.
 */
export async function updateThemeSettings(
  deps: SettingsDeps,
  input: ThemeSettings,
  updatedBy: string | null,
): Promise<Result<ThemeSettings>> {
  return ok(await deps.write.updateTheme(input, updatedBy));
}
