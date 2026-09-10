import type { SupabaseClient } from "@supabase/supabase-js";

import type {
  ContactSettings,
  IdentitySettings,
  LegalSettings,
  SeoSettings,
  SettingsGroup,
  SocialsSettings,
} from "@/core/cms/entities/site-settings";
import type { ThemeSettings } from "@/core/cms/entities/theme-settings";
import type {
  SettingsReadPort,
  SettingsWritePort,
} from "@/core/cms/ports/settings.port";
import { errors } from "@/core/shared/errors";

import type { Database } from "../database.types";
import { mapPostgrestError, requireOneRow } from "../errors";
import {
  toContactSettings,
  toIdentitySettings,
  toLegalSettings,
  toSeoSettings,
  toSettingsValue,
  toSocialsSettings,
  toThemeSettings,
} from "../mappers/site-settings.mapper";

/**
 * Implémentation Supabase des ports de réglages.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE LIGNE PAR GROUPE, TOUJOURS PRÉSENTE — NI CRÉATION NI SUPPRESSION
 * ---------------------------------------------------------------------------
 * Les sept lignes de `site_settings` existent depuis le seed et la contrainte
 * `check` (migration 0007) empêche d'en écrire une huitième. Ce dépôt n'a donc
 * ni `create` ni `delete` : seulement une lecture et une modification, par
 * groupe. Une ligne absente serait un défaut de déploiement (seed non
 * appliqué), pas un état normal — `lireGroupe` lève plutôt que de renvoyer
 * `null`, à la différence de `findById` sur les collections.
 *
 * ⚠️  `.update()` ET NON `.upsert()` : un upsert masquerait silencieusement
 * une ligne manquante en la recréant avec la seule valeur du jour, sans
 * `updated_at` ni historique — exactement le genre d'écriture que
 * `requireOneRow` existe pour rendre visible plutôt que pour compenser.
 */
export class SupabaseSettingsRepository implements SettingsReadPort, SettingsWritePort {
  constructor(private readonly supabase: SupabaseClient<Database>) {}

  // ═══════════════════════════════════════════════════════════════ Lecture ══

  async getIdentity(): Promise<IdentitySettings> {
    return toIdentitySettings(await this.lireGroupe("identity"));
  }

  async getContact(): Promise<ContactSettings> {
    return toContactSettings(await this.lireGroupe("contact"));
  }

  async getLegal(): Promise<LegalSettings> {
    return toLegalSettings(await this.lireGroupe("legal"));
  }

  async getSocials(): Promise<SocialsSettings> {
    return toSocialsSettings(await this.lireGroupe("socials"));
  }

  async getSeo(): Promise<SeoSettings> {
    return toSeoSettings(await this.lireGroupe("seo"));
  }

  async getTheme(): Promise<ThemeSettings> {
    return toThemeSettings(await this.lireGroupe("theme"));
  }

  private async lireGroupe(groupe: SettingsGroup) {
    const { data, error } = await this.supabase
      .from("site_settings")
      .select("value")
      .eq("group", groupe)
      .maybeSingle();

    if (error) throw mapPostgrestError(error, { ressource: "réglages" });
    if (!data) {
      throw errors.unexpected(
        `Le groupe de réglages « ${groupe} » est introuvable en base.`,
      );
    }

    return data.value;
  }

  // ═══════════════════════════════════════════════════════════════ Écriture ══

  async updateIdentity(
    input: IdentitySettings,
    updatedBy: string | null,
  ): Promise<IdentitySettings> {
    return toIdentitySettings(await this.ecrireGroupe("identity", input, updatedBy));
  }

  async updateContact(
    input: ContactSettings,
    updatedBy: string | null,
  ): Promise<ContactSettings> {
    const valeur = await this.ecrireGroupe("contact", input, updatedBy);
    return toContactSettings(valeur);
  }

  async updateLegal(
    input: LegalSettings,
    updatedBy: string | null,
  ): Promise<LegalSettings> {
    return toLegalSettings(await this.ecrireGroupe("legal", input, updatedBy));
  }

  async updateSocials(
    input: SocialsSettings,
    updatedBy: string | null,
  ): Promise<SocialsSettings> {
    return toSocialsSettings(await this.ecrireGroupe("socials", input, updatedBy));
  }

  async updateSeo(input: SeoSettings, updatedBy: string | null): Promise<SeoSettings> {
    return toSeoSettings(await this.ecrireGroupe("seo", input, updatedBy));
  }

  async updateTheme(
    input: ThemeSettings,
    updatedBy: string | null,
  ): Promise<ThemeSettings> {
    return toThemeSettings(await this.ecrireGroupe("theme", input, updatedBy));
  }

  private async ecrireGroupe(
    groupe: SettingsGroup,
    input:
      | IdentitySettings
      | ContactSettings
      | LegalSettings
      | SocialsSettings
      | SeoSettings
      | ThemeSettings,
    updatedBy: string | null,
  ) {
    const { data, error } = await this.supabase
      .from("site_settings")
      .update({ value: toSettingsValue(input), updated_by: updatedBy })
      .eq("group", groupe)
      .select("value");

    if (error) throw mapPostgrestError(error, { ressource: "réglages" });

    /*
      Voir le commentaire « écriture silencieusement refusée » dans errors.ts.

      ⚠️  Compte doublement ici : `site_settings_admin_update` exige
      `app_can_publish()`. Un ÉDITEUR qui atteindrait cette méthode — la
      permission `settings:update` n'existe même pas sur sa liste, donc
      seulement par un défaut de programmation — verrait son écriture
      FILTRÉE par la RLS : HTTP 200, zéro ligne, succès apparent.
    */
    const refus = requireOneRow(data, { ressource: "réglages", action: "modifier" });
    if (refus) throw refus;

    return data![0]!.value;
  }
}
