import type {
  ContactSettings,
  IdentitySettings,
  LegalSettings,
  SeoSettings,
  SocialsSettings,
} from "../entities/site-settings";

/**
 * Ports des réglages du site — §10 du Rapport 2.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CINQ MÉTHODES EXPLICITES, PAS UNE PAIRE GÉNÉRIQUE `get(group)` / `set(…)`
 * ---------------------------------------------------------------------------
 * `site_settings` a une forme uniforme en base (`"group" text`, `value
 * jsonb`), mais chaque groupe a une forme TYPÉE différente en domaine
 * (`IdentitySettings`, `ContactSettings`, …). Une méthode générique
 * `get<G extends SettingsGroup>(group: G): Promise<SettingsValueOf<G>>`
 * aurait exigé une table de correspondance type-level rien que pour porter
 * cinq appels — et `core/rbac/permissions.ts` fait exactement ce choix
 * partout ailleurs (« les listes sont écrites EN TOUTES LETTRES ») pour rester
 * auditable d'un coup d'œil. Même principe ici : `getIdentity()` se lit sans
 * remonter une signature générique.
 *
 * `theme` et `features` n'ont AUCUNE méthode : ce lot ne les gère pas
 * (`theme` est le Lot 11 ; `features` est hors périmètre). Ne pas les ajouter
 * « pour la complétude » — une méthode sans appelant est une méthode non
 * testée.
 */
export interface SettingsReadPort {
  getIdentity(): Promise<IdentitySettings>;
  getContact(): Promise<ContactSettings>;
  getLegal(): Promise<LegalSettings>;
  getSocials(): Promise<SocialsSettings>;
  getSeo(): Promise<SeoSettings>;
}

/**
 * `updatedBy` : contrairement aux collections du Lot 8, `site_settings` porte
 * une colonne `updated_by` (migration 0007) — aucune n'a d'équivalent. Les
 * cas d'usage la reçoivent de `createAction` (qui connaît déjà l'acteur, pour
 * le journal d'audit) et la transmettent ici plutôt que de faire deviner au
 * dépôt qui a écrit, ou de le laisser vide alors que la colonne existe pour
 * ça.
 */
export interface SettingsWritePort {
  updateIdentity(
    input: IdentitySettings,
    updatedBy: string | null,
  ): Promise<IdentitySettings>;
  updateContact(
    input: ContactSettings,
    updatedBy: string | null,
  ): Promise<ContactSettings>;
  updateLegal(input: LegalSettings, updatedBy: string | null): Promise<LegalSettings>;
  updateSocials(
    input: SocialsSettings,
    updatedBy: string | null,
  ): Promise<SocialsSettings>;
  updateSeo(input: SeoSettings, updatedBy: string | null): Promise<SeoSettings>;
}

/**
 * Regroupement de confort pour les cas d'usage — un seul dépôt, comme
 * `CoreValueDeps` : `site_settings` n'a aucune clé étrangère.
 */
export type SettingsDeps = {
  read: SettingsReadPort;
  write: SettingsWritePort;
};
