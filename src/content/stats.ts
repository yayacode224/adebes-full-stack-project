import { CalendarDays, Layers, Target, Users, type LucideIcon } from "lucide-react";

import { siteConfig } from "@/lib/site-config";

import { programmes } from "./programmes";

/**
 * Chiffres clés.
 *
 * Sur l'ancien site, ces compteurs affichaient « 0 » dans le HTML et n'étaient
 * remplis que par JavaScript (constat #7 de l'audit) : sans JS, ou avant
 * hydratation, le visiteur lisait « 0 bénéficiaire ». Ici la valeur réelle est
 * dans le HTML rendu par le serveur ; l'animation ne fait que l'accompagner.
 *
 * `value: null` signifie « chiffre non encore fourni par l'association ». Il
 * est alors affiché comme tel plutôt qu'inventé : un chiffre d'impact
 * fabriqué serait la pire des fautes pour une structure qui vit de la
 * confiance des donateurs.
 */

export type Stat = {
  key: string;
  label: string;
  value: number | null;
  suffix?: string;
  icon: LucideIcon;
  /** Précision affichée sur la page Impact. */
  note?: string;
  /** true = valeur reprise de l'ancien site, à revalider avant publication. */
  toConfirm?: boolean;
};

const anneesActivite = Math.max(
  1,
  new Date().getFullYear() - siteConfig.foundingYear,
);

export const stats: Stat[] = [
  {
    key: "beneficiaires",
    label: "Bénéficiaires accompagnés",
    value: null,
    suffix: "+",
    icon: Users,
    note: "Chiffre à fournir par ADEBES à partir des rapports d'activité.",
  },
  {
    key: "projets",
    label: "Projets menés",
    value: 30,
    suffix: "+",
    icon: Target,
    note: "Valeur affichée sur l'ancien site — à revalider.",
    toConfirm: true,
  },
  {
    key: "programmes",
    label: "Programmes actifs",
    value: programmes.length,
    icon: Layers,
    note: "Correspond aux domaines d'intervention présentés sur ce site.",
  },
  {
    key: "annees",
    label: "Années au service des communautés",
    value: anneesActivite,
    suffix: "+",
    icon: CalendarDays,
    note: "Calculé à partir de l'année de création renseignée dans la configuration du site.",
    toConfirm: true,
  },
];

/** Sous-ensemble mis en avant sur l'accueil (jamais répété deux fois par page). */
export const homeStats = stats;
