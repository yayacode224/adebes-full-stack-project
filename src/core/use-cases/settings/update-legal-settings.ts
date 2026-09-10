import { toStoredText, type LegalSettings } from "../../cms/entities/site-settings";
import type { SettingsDeps } from "../../cms/ports/settings.port";
import { ok, type Result } from "../../shared/result";

/**
 * Modifie les mentions légales de l'association.
 *
 * Les trois champs qui portent aujourd'hui `[À COMPLÉTER]` en base —
 * `registrationNumber`, `registrationAuthority`, `publicationDirector` — sont
 * retraduits vers le marqueur s'ils sont laissés vides. Voir
 * `update-contact-settings.ts` pour le raisonnement complet ; il s'applique
 * ici à l'identique, à trois champs près.
 *
 * `hostingProvider` n'est jamais concerné : ce sont des faits (Vercel Inc.),
 * obligatoires dans `legal.schema.ts`, jamais marqués à compléter.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  C'EST CE CAS D'USAGE QUI FAIT DISPARAÎTRE LE MARQUEUR D'UN SITE DÉJÀ
 *     PUBLIC — LA PREMIÈRE FOIS QUE C'EST POSSIBLE SANS UN COMMIT
 * ---------------------------------------------------------------------------
 * `registrationNumber` s'affiche en clair dans la section Gouvernance migrée
 * de `/a-propos` depuis le Lot 9 (voir REPRISE-CONTEXTE.md). Renseigner ce
 * champ ici retire immédiatement le marqueur de cette page, dès la prochaine
 * invalidation de `cms:settings:legal`.
 */
export async function updateLegalSettings(
  deps: SettingsDeps,
  input: LegalSettings,
  updatedBy: string | null,
): Promise<Result<LegalSettings>> {
  const normalise: LegalSettings = {
    ...input,
    registrationNumber: toStoredText(input.registrationNumber),
    registrationAuthority: toStoredText(input.registrationAuthority),
    publicationDirector: toStoredText(input.publicationDirector),
  };

  return ok(await deps.write.updateLegal(normalise, updatedBy));
}
