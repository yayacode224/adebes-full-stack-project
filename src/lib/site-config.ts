/**
 * Source unique de vérité pour toutes les informations institutionnelles.
 *
 * Les valeurs marquées `À_COMPLETER` sont des informations que l'association
 * doit fournir avant la mise en ligne. Elles sont volontairement visibles
 * plutôt que masquées : l'audit a montré qu'un site qui collecte des dons sans
 * mentions légales ni numéro d'enregistrement perd la confiance des donateurs.
 */

export const TODO = "[À COMPLÉTER]" as const;

const DEFAULT_SITE_URL = "https://adebesgroup.com";

/**
 * URL canonique du site.
 *
 * Attention : une variable d'environnement **déclarée mais vide** est une
 * chaîne vide, pas `undefined` — `??` ne la rattrape donc pas. C'est
 * exactement ce qui se produit quand une variable est créée dans Vercel sans
 * être renseignée, et cela faisait échouer le build sur `new URL("")`.
 *
 * Chaque candidat est donc nettoyé puis réellement validé avant d'être retenu.
 * Seules des variables `NEXT_PUBLIC_` sont consultées : elles ont la même
 * valeur côté serveur et côté client, ce qui évite toute divergence entre le
 * HTML rendu et l'hydratation.
 */
function resolveSiteUrl(): string {
  const candidats = [
    process.env.NEXT_PUBLIC_SITE_URL,
    // Fournie automatiquement par Vercel : le site reste cohérent même si
    // NEXT_PUBLIC_SITE_URL n'a pas encore été renseignée.
    process.env.NEXT_PUBLIC_VERCEL_PROJECT_PRODUCTION_URL,
    DEFAULT_SITE_URL,
  ];

  for (const candidat of candidats) {
    const valeur = candidat?.trim();
    if (!valeur) continue;

    const avecProtocole = /^https?:\/\//i.test(valeur)
      ? valeur
      : `https://${valeur}`;

    try {
      // `origin` retire au passage le chemin et la barre oblique finale.
      return new URL(avecProtocole).origin;
    } catch {
      // Valeur inexploitable : on passe au candidat suivant.
    }
  }

  return DEFAULT_SITE_URL;
}

export const siteUrl = resolveSiteUrl();

export const siteConfig = {
  name: "ADEBES",
  legalName: "Association pour le Développement et le Bien-être Social",
  motto: "Solidarité – Développement – Bien-être",
  tagline: "Construisons un avenir meilleur ensemble.",
  description:
    "ADEBES œuvre pour le développement humain, la solidarité et le bien-être social à travers des actions concrètes au service de la communauté africaine.",
  /** Description courte réutilisée en meta description par défaut. */
  metaDescription:
    "ADEBES, association camerounaise à but non lucratif : éducation, santé, inclusion sociale et développement communautaire à Douala, Yaoundé et dans les régions de l'intérieur.",
  url: siteUrl,
  locale: "fr_CM",
  foundingYear: 2020,
} as const;

export const contact = {
  city: "Douala",
  country: "Cameroun",
  /** Adresse postale précise : absente de l'ancien site, à fournir. */
  streetAddress: TODO,
  postalCode: TODO,
  region: "Littoral",
  email: "contact@adebes.cm",
  /** Format E.164, utilisé pour les liens tel: et wa.me */
  phoneE164: "+237680678939",
  phoneDisplay: "+237 680 67 89 39",
  /**
   * L'ancien site affichait un second numéro dont le lien pointait en réalité
   * vers le premier (constat #5 de l'audit). Il n'est réintroduit que si un
   * numéro réellement distinct est fourni.
   */
  secondaryPhoneE164: null as string | null,
  secondaryPhoneDisplay: null as string | null,
  openingHours: "Lundi – Samedi, 8h – 18h",
  /** Format schema.org openingHours */
  openingHoursSpec: "Mo-Sa 08:00-18:00",
  /** Coordonnées de la carte : à affiner avec l'adresse exacte. */
  geo: { latitude: 4.0511, longitude: 9.7679 },
} as const;

/**
 * Numéro d'enregistrement officiel de l'association — obligatoire sur les
 * mentions légales d'une structure qui collecte des dons (audit §4.9).
 */
export const legal = {
  registrationNumber: TODO,
  registrationAuthority: TODO,
  publicationDirector: TODO,
  hostingProvider: {
    name: "Vercel Inc.",
    address: "440 N Barranca Ave #4133, Covina, CA 91723, États-Unis",
    url: "https://vercel.com",
  },
} as const;

type SocialLink = {
  label: string;
  href: string;
  /** false tant que l'URL réelle n'a pas été fournie par l'association. */
  configured: boolean;
};

/**
 * Aucun lien vers les réseaux sociaux n'existait sur l'ancien site (audit #7).
 * Les entrées non configurées sont rendues visuellement comme « bientôt » et
 * ne produisent jamais de lien mort.
 */
/** Une variable déclarée mais vide (ou remplie d'espaces) vaut « non fournie ». */
function socialLink(label: string, url: string | undefined): SocialLink {
  const href = url?.trim() ?? "";
  return { label, href, configured: href.length > 0 };
}

export const socials: Record<
  "facebook" | "instagram" | "tiktok",
  SocialLink
> = {
  facebook: socialLink("Facebook", process.env.NEXT_PUBLIC_FACEBOOK_URL),
  instagram: socialLink("Instagram", process.env.NEXT_PUBLIC_INSTAGRAM_URL),
  tiktok: socialLink("TikTok", process.env.NEXT_PUBLIC_TIKTOK_URL),
};

/** Construit un lien wa.me avec un message pré-rempli. */
export function whatsappLink(message: string): string {
  const number = contact.phoneE164.replace(/\D/g, "");
  return `https://wa.me/${number}?text=${encodeURIComponent(message)}`;
}

export const whatsappMessages = {
  don: "Bonjour ADEBES, je souhaite faire un don pour soutenir vos actions. Pouvez-vous m'indiquer la marche à suivre ?",
  benevolat:
    "Bonjour ADEBES, je souhaite devenir bénévole. Pouvez-vous me dire comment participer ?",
  contact: "Bonjour ADEBES, j'aimerais avoir des informations sur vos actions.",
  programme: (titre: string) =>
    `Bonjour ADEBES, je souhaite en savoir plus sur votre programme « ${titre} ».`,
} as const;
