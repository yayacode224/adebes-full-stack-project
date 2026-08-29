import {
  Accessibility,
  Briefcase,
  CalendarDays,
  Globe,
  GraduationCap,
  HandHeart,
  Handshake,
  HardHat,
  HeartHandshake,
  HeartPulse,
  Landmark,
  Layers,
  Leaf,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Sparkles,
  Sprout,
  Stethoscope,
  Target,
  TrendingUp,
  Users,
  type LucideIcon,
} from "lucide-react";

/**
 * Registre d'icônes — le pont entre une base de données et des composants React.
 *
 * `src/content/` stockait des COMPOSANTS (`icon: GraduationCap`). Une base ne
 * stocke qu'une CHAÎNE (`"GraduationCap"`). Ce fichier fait la conversion.
 *
 * Il vit dans la couche présentation, pas dans `core/` : le domaine n'a pas le
 * droit d'importer React (règle vérifiée par ESLint). Le domaine manipule le
 * nom de l'icône comme une simple chaîne, et ne sait rien de lucide-react.
 *
 * ⚠️  NE JAMAIS REMPLACER CE REGISTRE PAR UN IMPORT DYNAMIQUE.
 *
 * La tentation est grande d'écrire `await import(\`lucide-react/icons/\${nom}\`)`
 * pour éviter de maintenir une liste. Ce serait une faute : un import dynamique
 * par nom casse le tree-shaking, et le bundle embarquerait le millier d'icônes
 * de la bibliothèque. Sur une connexion mobile camerounaise, c'est plusieurs
 * secondes de chargement pour douze icônes réellement affichées.
 *
 * Le registre explicite est la seule option correcte. Son coût est d'une ligne
 * par icône ajoutée.
 */

/**
 * Les 21 icônes réellement utilisées aujourd'hui dans `src/content/`
 * (liste vérifiée par extraction des imports, pas recopiée de mémoire),
 * plus `Sparkles` qui ne sert qu'au repli.
 */
export const ICONS = {
  Accessibility,
  Briefcase,
  CalendarDays,
  Globe,
  GraduationCap,
  HandHeart,
  Handshake,
  HardHat,
  HeartHandshake,
  HeartPulse,
  Landmark,
  Layers,
  Leaf,
  Lightbulb,
  Rocket,
  ShieldCheck,
  Sprout,
  Stethoscope,
  Target,
  TrendingUp,
  Users,
  /** Repli uniquement — non utilisée par le contenu actuel. */
  Sparkles,
} as const;

export type IconName = keyof typeof ICONS;

/** Alimente la grille de sélection d'icônes du `<SchemaForm>` (Lot 6). */
export const ICON_NAMES = Object.keys(ICONS) as IconName[];

export function isIconName(valeur: unknown): valeur is IconName {
  return typeof valeur === "string" && valeur in ICONS;
}

/**
 * Résout un nom d'icône, avec repli.
 *
 * Le repli n'est pas de la complaisance : le nom vient de la base, donc d'une
 * saisie humaine ou d'une migration. Un nom devenu invalide — icône renommée
 * dans une version de lucide, faute de frappe corrigée trop tard — ne doit
 * jamais produire une page blanche en production. Il produit une étoile.
 */
export function getIcon(nom: string | null | undefined): LucideIcon {
  return isIconName(nom) ? ICONS[nom] : ICONS.Sparkles;
}
