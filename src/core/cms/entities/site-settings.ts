/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES GROUPES DE RÉGLAGES DU SITE (Famille C)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8 du Rapport 1, §10 du Rapport 2. Reprise de `src/lib/site-config.ts` et
 * `src/lib/navigation.ts`, désormais en base (`site_settings`, une ligne par
 * groupe, `"group" text primary key`).
 *
 * Sept groupes existent en base (contrainte `check` de la migration 0007),
 * mais le Lot 10 n'en couvre que CINQ : `identity`, `contact`, `legal`,
 * `socials`, `seo`. Les deux autres ont leur propre lot :
 *
 *   * `theme`  — Lot 11 (éditeur d'apparence, tokens CSS) ;
 *   * `features` — hors périmètre de ce lot, ligne vide (`{}`) depuis le seed.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE MARQUEUR « [À COMPLÉTER] » EST UNE VALEUR, PAS UN `null`
 * ---------------------------------------------------------------------------
 * Invariant nº 1 du projet appliqué au texte : une information manquante n'est
 * jamais fabriquée. `src/server/dal/dashboard-overview.ts` (Lot 5) scrute déjà
 * `site_settings` à la recherche de ce marqueur pour construire le bloc
 * « À compléter » du tableau de bord — c'est ce comportement EXISTANT qui fixe
 * la convention : le champ reste une chaîne, et la chaîne PEUT valoir
 * exactement `SETTINGS_TODO_MARKER`.
 *
 * Les cas d'usage d'écriture de ce lot (`update-contact-settings.ts`,
 * `update-legal-settings.ts`) traduisent un champ laissé vide par
 * l'utilisateur en ce marqueur, pour que la saisie reste naturelle : personne
 * ne doit taper « [À COMPLÉTER] » au clavier.
 */

/** Les sept groupes que la base accepte (migration 0007). */
export const SETTINGS_GROUPS = [
  "identity",
  "contact",
  "legal",
  "socials",
  "seo",
  "theme",
  "features",
] as const;

export type SettingsGroup = (typeof SETTINGS_GROUPS)[number];

/** Les cinq groupes gérés par ce lot — `theme` et `features` n'en font pas partie. */
export const LOT_10_SETTINGS_GROUPS = [
  "identity",
  "contact",
  "legal",
  "socials",
  "seo",
] as const;

/**
 * Le marqueur affiché à la place d'une information légale ou de contact non
 * fournie. Même chaîne, en dur, que `src/lib/site-config.ts` (`TODO`) et que
 * `src/server/dal/dashboard-overview.ts` (`MARQUEUR`) : les trois doivent
 * rester identiques, et aucune des trois couches ne peut importer les deux
 * autres (`core/` ne dépend de rien, `dal/` ne dépend pas de `lib/`).
 */
export const SETTINGS_TODO_MARKER = "[À COMPLÉTER]" as const;

/**
 * Chaîne saisie → chaîne stockée. Un champ laissé vide (après recadrage des
 * espaces) devient le marqueur ; toute autre valeur est stockée telle quelle.
 *
 * Utilisé à l'ÉCRITURE par les cas d'usage `update-contact-settings.ts` et
 * `update-legal-settings.ts`, sur les seuls champs qui admettent le marqueur.
 */
export function toStoredText(saisie: string): string {
  const valeur = saisie.trim();
  return valeur.length === 0 ? SETTINGS_TODO_MARKER : valeur;
}

/**
 * Chaîne stockée → chaîne éditable. Le marqueur redevient une chaîne vide,
 * pour que le formulaire propose un champ à remplir plutôt que le marqueur
 * lui-même à retaper ou, pire, à corriger par erreur.
 *
 * Utilisé à la LECTURE par les composants de formulaire — jamais par un cas
 * d'usage : ce n'est pas ainsi que la donnée doit être vue par le reste du
 * domaine (`dashboard-overview.ts` continue de chercher le marqueur en base).
 */
export function toEditableText(stockee: string): string {
  return stockee === SETTINGS_TODO_MARKER ? "" : stockee;
}

/* ═══════════════════════════════════════════════════════════════════════════
 * identity
 * ═══════════════════════════════════════════════════════════════════════════ */

export type IdentitySettings = {
  name: string;
  legalName: string;
  motto: string;
  tagline: string;
  description: string;
  foundingYear: number;
  logoMediaId: string | null;
  faviconMediaId: string | null;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * contact
 * ═══════════════════════════════════════════════════════════════════════════ */

export type ContactGeo = {
  latitude: number;
  longitude: number;
};

export type ContactSettings = {
  city: string;
  country: string;
  /** Peut valoir `SETTINGS_TODO_MARKER` : absente de l'ancien site. */
  streetAddress: string;
  /** Peut valoir `SETTINGS_TODO_MARKER`. */
  postalCode: string;
  region: string;
  email: string;
  /** Format E.164 — utilisé pour les liens `tel:` et `wa.me`. */
  phoneE164: string;
  phoneDisplay: string;
  /**
   * `null` tant qu'aucun second numéro RÉELLEMENT distinct n'a été fourni.
   * L'ancien site affichait un second numéro dont le lien pointait en réalité
   * vers le premier (constat nº 5 de l'audit) : la validation d'écriture
   * (`contact.schema.ts`) refuse une valeur identique à `phoneE164`.
   */
  secondaryPhoneE164: string | null;
  secondaryPhoneDisplay: string | null;
  openingHours: string;
  /** Format `schema.org` `openingHours` (ex. `Mo-Sa 08:00-18:00`). */
  openingHoursSpec: string;
  geo: ContactGeo;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * legal
 * ═══════════════════════════════════════════════════════════════════════════ */

export type HostingProvider = {
  name: string;
  address: string;
  url: string;
};

export type LegalSettings = {
  /** Peut valoir `SETTINGS_TODO_MARKER`. */
  registrationNumber: string;
  /** Peut valoir `SETTINGS_TODO_MARKER`. */
  registrationAuthority: string;
  /** Peut valoir `SETTINGS_TODO_MARKER`. */
  publicationDirector: string;
  hostingProvider: HostingProvider;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * socials
 * ═══════════════════════════════════════════════════════════════════════════ */

/** Les trois réseaux du projet — voir `src/lib/site-config.ts`, `socialLink()`. */
export const SOCIAL_NETWORKS = ["facebook", "instagram", "tiktok"] as const;
export type SocialNetwork = (typeof SOCIAL_NETWORKS)[number];

/**
 * `configured` est un CHOIX de l'utilisateur, pas une déduction de `href`.
 *
 * Invariant nº 2 du projet (aucun lien mort) : `configured: false` produit une
 * icône grisée « bientôt » plutôt qu'un lien vers une page vide. Le dériver de
 * `href.length > 0` couplerait deux décisions distinctes — « le compte
 * existe-t-il » et « son adresse est-elle actuellement renseignée » — alors
 * qu'un compte peut exister sans que l'URL soit encore à portée de main.
 */
/**
 * `label` est générique par paramètre de type plutôt que `string` : chaque
 * réseau de `SocialsSettings`, ci-dessous, le fixe à SA valeur littérale
 * (`"Facebook"`, …), pour rester identique au type que produit
 * `socials.schema.ts` (`z.literal(...)` par réseau). Une divergence entre les
 * deux romprait `defaultValues` du formulaire — `DefaultValues<T>` exige la
 * même précision que `T`, pas seulement la même forme.
 */
export type SocialLinkSetting<Label extends string = string> = {
  label: Label;
  href: string;
  configured: boolean;
};

export type SocialsSettings = {
  facebook: SocialLinkSetting<"Facebook">;
  instagram: SocialLinkSetting<"Instagram">;
  tiktok: SocialLinkSetting<"TikTok">;
};

/* ═══════════════════════════════════════════════════════════════════════════
 * seo
 * ═══════════════════════════════════════════════════════════════════════════ */

export type SeoSettings = {
  metaDescription: string;
  keywords: string[];
  /** Image Open Graph par défaut — `null` tant qu'aucune n'a été choisie. */
  ogMediaId: string | null;
  locale: string;
};
