import type { z } from "zod";

import type {
  ContactSettings,
  IdentitySettings,
  LegalSettings,
  SeoSettings,
  SocialsSettings,
} from "@/core/cms/entities/site-settings";
import { contactSettingsSchema } from "@/core/cms/schemas/settings/contact.schema";
import { identitySettingsSchema } from "@/core/cms/schemas/settings/identity.schema";
import { legalSettingsSchema } from "@/core/cms/schemas/settings/legal.schema";
import { seoSettingsSchema } from "@/core/cms/schemas/settings/seo.schema";
import { socialsSettingsSchema } from "@/core/cms/schemas/settings/socials.schema";
import { errors } from "@/core/shared/errors";

import type { Json } from "../database.types";

/**
 * Conversion entre `site_settings.value` (JSONB, donc sans forme pour la base)
 * et les cinq types de domaine du Lot 10.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE SCHÉMA EST REJOUÉ ICI, À LA LECTURE — TROISIÈME PROPRIÉTÉ DU §10
 * ---------------------------------------------------------------------------
 * Gabarit de `parseContenu()` (`core/cms/blocks/registry.ts`, Lot 9), qui fait
 * subir le même sort au contenu des sections. La différence tient à la
 * polymorphie : une section peut porter dix-sept types de blocs, ce qui
 * oblige `parseContenu` à choisir le schéma par un registre, dans le cas
 * d'usage. Un groupe de réglages a TOUJOURS le même schéma — `getIdentity()`
 * valide toujours avec `identitySettingsSchema` — ce qui permet de faire la
 * conversion ici, au même endroit que `toCoreValue` convertit et défend
 * `icon`.
 *
 * ⚠️  CE QUE CE MAPPEUR NE FAIT PAS : SE RATTRAPER SUR UNE LIGNE CORROMPUE.
 * Contrairement à `icon`, il n'existe pas de repli plausible pour un groupe de
 * réglages entier — remplacer un nom d'association corrompu par une valeur
 * inventée violerait l'invariant nº 1 plus sûrement qu'une erreur affichée. Ce
 * mapeur LÈVE donc si la ligne ne correspond plus au schéma, et c'est la
 * lecture PUBLIQUE (`server/queries/settings.query.ts`) qui décide quoi faire
 * de cette exception — elle la rattrape et replie sur `site-config.ts`,
 * exactement pour la raison que donne le §10.3 du Rapport 2 : une panne de
 * lecture des réglages ne doit jamais faire tomber tout le site.
 */
function parseGroupe<T>(schema: z.ZodType<T>, valeur: Json, groupe: string): T {
  const analyse = schema.safeParse(valeur);
  if (!analyse.success) {
    throw errors.unexpected(
      `Les réglages « ${groupe} » sont corrompus en base et ne peuvent pas être lus.`,
      analyse.error,
    );
  }
  return analyse.data;
}

export function toIdentitySettings(valeur: Json): IdentitySettings {
  return parseGroupe(identitySettingsSchema, valeur, "identity");
}

export function toContactSettings(valeur: Json): ContactSettings {
  return parseGroupe(contactSettingsSchema, valeur, "contact");
}

export function toLegalSettings(valeur: Json): LegalSettings {
  return parseGroupe(legalSettingsSchema, valeur, "legal");
}

export function toSocialsSettings(valeur: Json): SocialsSettings {
  return parseGroupe(socialsSettingsSchema, valeur, "socials");
}

export function toSeoSettings(valeur: Json): SeoSettings {
  return parseGroupe(seoSettingsSchema, valeur, "seo");
}

/**
 * Domaine → JSONB, à l'écriture.
 *
 * Aucune conversion de forme : les cinq types de domaine de ce lot ne sont
 * que des chaînes, des nombres, des booléens et des objets imbriqués — déjà
 * la forme JSON. Le cast est le même que celui de `page.mapper.ts` pour
 * `content`, et pour la même raison : `Json` ne peut pas exprimer un type
 * précis en amont, TypeScript n'a donc aucun moyen de le vérifier
 * structurellement, alors qu'il l'EST — la valeur vient d'être validée par le
 * schéma d'écriture dans `createAction`, avant que ce mapeur ne soit atteint.
 */
export function toSettingsValue(
  input: IdentitySettings | ContactSettings | LegalSettings | SocialsSettings | SeoSettings,
): Json {
  return input as unknown as Json;
}
