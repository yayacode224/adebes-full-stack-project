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

import {
  ICON_NAMES,
  ICON_NAME_REPLI,
  isIconName,
  type IconName,
} from "@/core/cms/entities/icon-name";

/**
 * Registre d'icônes — le pont entre une base de données et des composants React.
 *
 * `src/content/` stockait des COMPOSANTS (`icon: GraduationCap`). Une base ne
 * stocke qu'une CHAÎNE (`"GraduationCap"`). Ce fichier fait la conversion.
 *
 * ---------------------------------------------------------------------------
 * LA LISTE DES NOMS A DÉMÉNAGÉ DANS LE DOMAINE AU LOT 8E
 * ---------------------------------------------------------------------------
 * Elle est désormais dans `src/core/cms/entities/icon-name.ts`, et l'en-tête de
 * ce fichier-là explique pourquoi : sans elle dans `core/`, aucun schéma ne
 * pouvait vérifier qu'un nom d'icône en est un, et `programme.schema.ts`
 * acceptait donc n'importe quelle chaîne.
 *
 * Ce fichier garde ce que le domaine ne peut pas porter : les composants. Il
 * ré-exporte `ICON_NAMES`, `IconName` et `isIconName` pour que les appelants
 * existants — `choice-fields.tsx`, `content-icon.tsx` — n'aient pas à savoir
 * d'où vient quoi.
 *
 * ⚠️  `ICONS` est déclaré `Record<IconName, LucideIcon>` : c'est ce typage,
 * et non un commentaire, qui garantit que les deux fichiers ne divergent
 * jamais. Ajouter un nom dans le domaine sans ajouter le composant ici **casse
 * la compilation** ; en retirer un du domaine sans retirer le composant la
 * casse aussi. Le jour où quelqu'un remplace ce type par un `as const`, cette
 * garantie disparaît sans bruit.
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
export const ICONS: Record<IconName, LucideIcon> = {
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
  /** Repli — sélectionnable malgré tout, voir `icon-name.ts`. */
  Sparkles,
};

export { ICON_NAMES, isIconName, type IconName };

/**
 * Résout un nom d'icône, avec repli.
 *
 * Le repli n'est pas de la complaisance : le nom vient de la base, donc d'une
 * saisie humaine ou d'une migration. Un nom devenu invalide — icône renommée
 * dans une version de lucide, faute de frappe corrigée trop tard — ne doit
 * jamais produire une page blanche en production. Il produit une étoile.
 */
export function getIcon(nom: string | null | undefined): LucideIcon {
  return ICONS[isIconName(nom) ? nom : ICON_NAME_REPLI];
}
