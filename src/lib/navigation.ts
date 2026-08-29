/**
 * Architecture de navigation.
 *
 * L'ancien site mélangeait « Nos Actions » et « Nos Programmes » sans que la
 * première rubrique corresponde à une section réelle (constat #6 de l'audit) :
 * une seule entrée « Programmes » subsiste, et chaque lien mène à une URL
 * réelle — aucun `#` nulle part.
 */

export type NavItem = {
  label: string;
  href: string;
  description?: string;
};

export const mainNav: NavItem[] = [
  { label: "Accueil", href: "/" },
  {
    label: "Qui sommes-nous",
    href: "/a-propos",
    description: "Mission, valeurs, équipe et gouvernance",
  },
  {
    label: "Biographie",
    href: "/biographie",
    description: "M. Tana TEBOH Taduis",
  },
  {
    label: "Programmes",
    href: "/programmes",
    description: "Nos 8 domaines d'intervention",
  },
  {
    label: "Impact",
    href: "/impact",
    description: "Chiffres et transparence financière",
  },
  {
    label: "Actualités",
    href: "/actualites",
    description: "Les nouvelles du terrain",
  },
  {
    label: "Galerie",
    href: "/galerie",
    description: "Photos et vidéos de nos actions",
  },
  { label: "Contact", href: "/contact", description: "Nous écrire" },
];

/** Les deux parcours de conversion, mis en avant partout. */
export const conversionNav: NavItem[] = [
  { label: "Faire un don", href: "/don" },
  { label: "Devenir bénévole", href: "/benevolat" },
];

export const legalNav: NavItem[] = [
  { label: "Mentions légales", href: "/mentions-legales" },
  { label: "Politique de confidentialité", href: "/politique-confidentialite" },
];

/** Détermine si un lien de navigation doit être marqué comme actif. */
export function isActivePath(pathname: string, href: string): boolean {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(`${href}/`);
}

/**
 * Pages ouvertes par un hero pleine largeur : le header s'y superpose à la
 * photo (fond transparent, texte blanc) puis prend un fond opaque au scroll.
 * Partout ailleurs — pages légales, 404 — il est opaque dès le chargement,
 * pour que le logo et les liens restent lisibles en toutes circonstances.
 */
const OVERLAY_HERO_PREFIXES = [
  "/a-propos",
  "/biographie",
  "/programmes",
  "/actualites",
  "/galerie",
  "/impact",
  "/don",
  "/benevolat",
  "/contact",
];

export function hasOverlayHero(pathname: string): boolean {
  if (pathname === "/") return true;
  return OVERLAY_HERO_PREFIXES.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`),
  );
}
