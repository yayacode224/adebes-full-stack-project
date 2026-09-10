import type { SocialsSettings } from "../../cms/entities/site-settings";
import type { SettingsDeps } from "../../cms/ports/settings.port";
import { ok, type Result } from "../../shared/result";

/**
 * Modifie les réseaux sociaux.
 *
 * Pas de normalisation : `configured` est déjà la décision explicite de
 * l'utilisateur (voir `socials.schema.ts`), et `href` est déjà validé comme
 * une URL sécurisée non vide quand `configured` vaut `true`. Rien à recalculer
 * ici — contrairement à `contact` et `legal`, aucun champ de ce groupe n'admet
 * le marqueur `SETTINGS_TODO_MARKER` : un réseau non configuré se dit par
 * `configured: false`, jamais par un texte à compléter.
 */
export async function updateSocialsSettings(
  deps: SettingsDeps,
  input: SocialsSettings,
  updatedBy: string | null,
): Promise<Result<SocialsSettings>> {
  return ok(await deps.write.updateSocials(input, updatedBy));
}
