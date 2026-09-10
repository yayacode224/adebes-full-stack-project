import { toStoredText, type ContactSettings } from "../../cms/entities/site-settings";
import type { SettingsDeps } from "../../cms/ports/settings.port";
import { ok, type Result } from "../../shared/result";

/**
 * Modifie les coordonnées de l'association.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX CHAMPS TRADUITS VERS LE MARQUEUR, ET EUX SEULS
 * ---------------------------------------------------------------------------
 * `streetAddress` et `postalCode` sont les deux seuls champs de ce groupe qui
 * portent aujourd'hui `[À COMPLÉTER]` en base (voir le seed, §0 du dossier).
 * Le formulaire les affiche vides pour cette valeur (`toEditableText`, lu par
 * `contact-settings-form.tsx`) ; ce cas d'usage fait le trajet inverse à
 * l'écriture, pour qu'une case laissée vide REDEVIENNE le marqueur plutôt que
 * de s'enregistrer comme une chaîne vide que `dashboard-overview.ts` ne sait
 * pas repérer.
 *
 * `city`, `country`, `region`, `email`, les deux téléphones et les horaires ne
 * sont PAS concernés : ce sont des informations déjà connues, obligatoires
 * dans le schéma (`contact.schema.ts`), qui ne peuvent donc jamais arriver
 * vides ici.
 *
 * ---------------------------------------------------------------------------
 * LE TÉLÉPHONE SECONDAIRE EST DÉJÀ VALIDÉ EN AMONT
 * ---------------------------------------------------------------------------
 * La comparaison avec le numéro principal et la cohérence E.164 / affichage
 * sont deux `.refine()` de `contact.schema.ts`, rejoués par `createAction`
 * avant que ce cas d'usage ne s'exécute. Rien à revérifier ici.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE TÉLÉPHONE SECONDAIRE VIDE REDEVIENT `null`, PAS `""`
 * ---------------------------------------------------------------------------
 * `ContactSettingsForm` affiche `secondaryPhoneE164 ?? ""` — un `<input>` ne
 * sait pas porter `null` (même raison que `NumberField`, §8G). Sans ce trajet
 * inverse, ENREGISTRER UN CHAMP SANS RAPPORT (l'adresse, les horaires…) sur un
 * compte dont le second numéro vaut `null` réécrirait silencieusement `""` à
 * sa place — trouvé par la recette navigateur du Lot 10 en conditions
 * réelles : cette régression est passée inaperçue de deux cas d'usage purs et
 * d'un appel direct au dépôt, qui ne soumettent jamais le formulaire entier.
 */
export async function updateContactSettings(
  deps: SettingsDeps,
  input: ContactSettings,
  updatedBy: string | null,
): Promise<Result<ContactSettings>> {
  const normalise: ContactSettings = {
    ...input,
    streetAddress: toStoredText(input.streetAddress),
    postalCode: toStoredText(input.postalCode),
    secondaryPhoneE164: input.secondaryPhoneE164?.trim() || null,
    secondaryPhoneDisplay: input.secondaryPhoneDisplay?.trim() || null,
  };

  return ok(await deps.write.updateContact(normalise, updatedBy));
}
