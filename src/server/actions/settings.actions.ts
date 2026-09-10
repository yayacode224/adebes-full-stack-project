"use server";

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
import { updateContactSettings } from "@/core/use-cases/settings/update-contact-settings";
import { updateIdentitySettings } from "@/core/use-cases/settings/update-identity-settings";
import { updateLegalSettings } from "@/core/use-cases/settings/update-legal-settings";
import { updateSeoSettings } from "@/core/use-cases/settings/update-seo-settings";
import { updateSocialsSettings } from "@/core/use-cases/settings/update-socials-settings";

import { createAction } from "../action-kit/create-action";
import { settingsDeps } from "../deps/settings.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES RÉGLAGES DU SITE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10 du Rapport 2. Cinq actions, une par groupe géré par ce lot — `theme`
 * (Lot 11) et `features` (hors périmètre) n'en ont aucune.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE SEULE PERMISSION POUR LES CINQ : `settings:update`
 * ---------------------------------------------------------------------------
 * `core/rbac/permissions.ts` ne distingue pas les groupes — `settings:update`
 * couvre `identity`, `contact`, `legal`, `socials` ET `seo` à la fois, pour
 * `super_admin` et `admin` seulement (absente de la liste `editor`). La RLS
 * dit la même chose (`site_settings_admin_update`, `app_can_publish()`) : un
 * éditeur qui atteindrait l'une de ces cinq actions serait arrêté par les deux
 * barrières indépendamment.
 *
 * ---------------------------------------------------------------------------
 * CHAQUE ACTION N'INVALIDE QUE SON PROPRE GROUPE
 * ---------------------------------------------------------------------------
 * `cms:settings:<group>` (§11 du Rapport 1) — jamais `cms:settings` en bloc :
 * modifier l'identité ne doit pas invalider les réglages SEO, que rien n'a
 * changés. Les étiquettes sont posées maintenant et n'ont pas encore d'effet
 * (`'use cache'` n'est activé qu'au Lot 15, comme pour toutes les lectures
 * publiques du projet) — même situation que `values.query.ts` au Lot 8E.
 *
 * ---------------------------------------------------------------------------
 * `updatedBy` VIENT DE L'ACTEUR QUE `createAction` A DÉJÀ RÉSOLU
 * ---------------------------------------------------------------------------
 * `site_settings.updated_by` (migration 0007) n'a pas d'équivalent sur les
 * collections du Lot 8 : c'est la seule table de ce projet qui porte QUI a
 * écrit la ligne, en plus du journal d'audit qui le dit déjà. `actor` est
 * garanti non `null` ici : `permission` n'est jamais `null` sur ces cinq
 * actions, et `createAction` refuse toute exécution sans session avant
 * d'atteindre le handler.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * identity
 * ═══════════════════════════════════════════════════════════════════════════ */

export const mettreAJourIdentiteAction = createAction<
  typeof identitySettingsSchema,
  IdentitySettings
>({
  permission: "settings:update",
  input: identitySettingsSchema,
  audit: { action: "settings.update_identity", entityType: "site_settings" },
  invalidates: () => ["cms:settings:identity"],
  handler: async ({ input, actor }) =>
    updateIdentitySettings(await settingsDeps(), input, actor?.id ?? null),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * contact
 * ═══════════════════════════════════════════════════════════════════════════ */

export const mettreAJourContactAction = createAction<
  typeof contactSettingsSchema,
  ContactSettings
>({
  permission: "settings:update",
  input: contactSettingsSchema,
  audit: { action: "settings.update_contact", entityType: "site_settings" },
  invalidates: () => ["cms:settings:contact"],
  handler: async ({ input, actor }) =>
    updateContactSettings(await settingsDeps(), input, actor?.id ?? null),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * legal
 * ═══════════════════════════════════════════════════════════════════════════ */

export const mettreAJourLegalAction = createAction<
  typeof legalSettingsSchema,
  LegalSettings
>({
  permission: "settings:update",
  input: legalSettingsSchema,
  audit: { action: "settings.update_legal", entityType: "site_settings" },
  invalidates: () => ["cms:settings:legal"],
  handler: async ({ input, actor }) =>
    updateLegalSettings(await settingsDeps(), input, actor?.id ?? null),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * socials
 * ═══════════════════════════════════════════════════════════════════════════ */

export const mettreAJourReseauxSociauxAction = createAction<
  typeof socialsSettingsSchema,
  SocialsSettings
>({
  permission: "settings:update",
  input: socialsSettingsSchema,
  audit: { action: "settings.update_socials", entityType: "site_settings" },
  invalidates: () => ["cms:settings:socials"],
  handler: async ({ input, actor }) =>
    updateSocialsSettings(await settingsDeps(), input, actor?.id ?? null),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * seo
 * ═══════════════════════════════════════════════════════════════════════════ */

export const mettreAJourSeoAction = createAction<typeof seoSettingsSchema, SeoSettings>({
  permission: "settings:update",
  input: seoSettingsSchema,
  audit: { action: "settings.update_seo", entityType: "site_settings" },
  invalidates: () => ["cms:settings:seo"],
  handler: async ({ input, actor }) =>
    updateSeoSettings(await settingsDeps(), input, actor?.id ?? null),
});
