import "server-only";

import { cache } from "react";

import type {
  ContactSettings,
  IdentitySettings,
  LegalSettings,
  SeoSettings,
  SocialsSettings,
} from "@/core/cms/entities/site-settings";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseSettingsRepository } from "@/infrastructure/supabase/repositories/settings.repository";
import { contact, legal, siteConfig } from "@/lib/site-config";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DES RÉGLAGES DU SITE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10.3 du Rapport 2. Seule porte par laquelle le site public lit les cinq
 * groupes de réglages gérés par ce lot.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA SEULE LECTURE PUBLIQUE DE CE PROJET QUI RATTRAPE SON ÉCHEC
 * ---------------------------------------------------------------------------
 * `values.query.ts` (§8E) et toutes les lectures publiques des Lots 8 et 9
 * LÈVENT sur un échec : « une lecture en échec ne doit pas vider la section,
 * elle doit lever ». C'est le bon choix pour un contenu éditorial — un
 * programme, un article — dont la disparition silencieuse serait prise pour
 * une collection vide.
 *
 * Ce fichier fait l'INVERSE, et le §10.3 le demande explicitement :
 * `src/lib/site-config.ts` « sert de valeurs de repli si la base est
 * injoignable au build. Ce filet évite qu'une panne Supabase casse un
 * déploiement. » Une panne de lecture des RÉGLAGES touche potentiellement
 * CHAQUE page du site — jusqu'au layout racine, dont les métadonnées
 * dépendent de `getIdentitySettings()`. Lever ici ferait tomber le site
 * ENTIER pour une ligne de configuration, ce qui est disproportionné : mieux
 * vaut un site qui affiche le nom et l'adresse d'hier que plus de site du
 * tout.
 *
 * La même règle couvre une ligne CORROMPUE, pas seulement une base
 * injoignable : `SupabaseSettingsRepository` lève dans les deux cas (voir
 * `site-settings.mapper.ts`), et ce fichier ne distingue pas — les deux
 * pannes méritent le même filet.
 */

function portPublic() {
  return new SupabaseSettingsRepository(createPublicClient());
}

/** Repli identique à `siteConfig` (`src/lib/site-config.ts`), Lot 10 non appliqué. */
const IDENTITY_REPLI: IdentitySettings = {
  name: siteConfig.name,
  legalName: siteConfig.legalName,
  motto: siteConfig.motto,
  tagline: siteConfig.tagline,
  description: siteConfig.description,
  foundingYear: siteConfig.foundingYear,
  logoMediaId: null,
  faviconMediaId: null,
};

const CONTACT_REPLI: ContactSettings = {
  city: contact.city,
  country: contact.country,
  streetAddress: contact.streetAddress,
  postalCode: contact.postalCode,
  region: contact.region,
  email: contact.email,
  phoneE164: contact.phoneE164,
  phoneDisplay: contact.phoneDisplay,
  secondaryPhoneE164: contact.secondaryPhoneE164,
  secondaryPhoneDisplay: contact.secondaryPhoneDisplay,
  openingHours: contact.openingHours,
  openingHoursSpec: contact.openingHoursSpec,
  geo: { latitude: contact.geo.latitude, longitude: contact.geo.longitude },
};

const LEGAL_REPLI: LegalSettings = {
  registrationNumber: legal.registrationNumber,
  registrationAuthority: legal.registrationAuthority,
  publicationDirector: legal.publicationDirector,
  hostingProvider: { ...legal.hostingProvider },
};

/**
 * `configured: false` pour les trois : c'est l'état de `socials`
 * (`src/lib/site-config.ts`) tant qu'aucune variable d'environnement
 * `NEXT_PUBLIC_*_URL` n'est renseignée — le même état que le seed écrit en
 * base pour une installation neuve.
 */
const SOCIALS_REPLI: SocialsSettings = {
  facebook: { label: "Facebook", href: "", configured: false },
  instagram: { label: "Instagram", href: "", configured: false },
  tiktok: { label: "TikTok", href: "", configured: false },
};

/**
 * Reprise à l'identique des mots-clés codés en dur dans `src/app/layout.tsx`
 * avant ce lot — voir l'écart consigné dans REPRISE-CONTEXTE.md au Lot 10.
 */
const SEO_REPLI: SeoSettings = {
  metaDescription: siteConfig.metaDescription,
  keywords: [
    "ADEBES",
    "association Cameroun",
    "ONG Douala",
    "développement communautaire",
    "éducation Cameroun",
    "santé Cameroun",
    "bénévolat Cameroun",
    "faire un don Cameroun",
  ],
  ogMediaId: null,
  locale: siteConfig.locale,
};

function surErreur(groupe: string, erreur: unknown): void {
  console.error(
    `[ADEBES] Lecture des réglages « ${groupe} » impossible, repli sur site-config.ts`,
    erreur,
  );
}

export const getIdentitySettings = cache(async (): Promise<IdentitySettings> => {
  try {
    return await portPublic().getIdentity();
  } catch (erreur) {
    surErreur("identity", erreur);
    return IDENTITY_REPLI;
  }
});

export const getContactSettings = cache(async (): Promise<ContactSettings> => {
  try {
    return await portPublic().getContact();
  } catch (erreur) {
    surErreur("contact", erreur);
    return CONTACT_REPLI;
  }
});

export const getLegalSettings = cache(async (): Promise<LegalSettings> => {
  try {
    return await portPublic().getLegal();
  } catch (erreur) {
    surErreur("legal", erreur);
    return LEGAL_REPLI;
  }
});

export const getSocialsSettings = cache(async (): Promise<SocialsSettings> => {
  try {
    return await portPublic().getSocials();
  } catch (erreur) {
    surErreur("socials", erreur);
    return SOCIALS_REPLI;
  }
});

export const getSeoSettings = cache(async (): Promise<SeoSettings> => {
  try {
    return await portPublic().getSeo();
  } catch (erreur) {
    surErreur("seo", erreur);
    return SEO_REPLI;
  }
});
