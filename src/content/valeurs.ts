import {
  HeartHandshake,
  Lightbulb,
  ShieldCheck,
  TrendingUp,
  type LucideIcon,
} from "lucide-react";

import type { MediaTone } from "@/components/media/media-placeholder";

export type Valeur = {
  title: string;
  description: string;
  icon: LucideIcon;
  tone: MediaTone;
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️  CE FICHIER N'EST PLUS IMPORTÉ PAR AUCUNE PAGE DEPUIS LE LOT 8E
 * ═══════════════════════════════════════════════════════════════════════════
 * Les valeurs viennent de la base (`server/queries/values.query.ts`), lues par
 * l'accueil ET par « Qui sommes-nous ». Le fichier reste — comme
 * `programmes.ts`, `actualites.ts`, `temoignages.ts` et `equipe.ts` — pour sa
 * valeur de référence : c'est ici qu'est consigné le texte d'origine, celui
 * que le seed du Lot 1 a repris mot pour mot. Il sera retiré au Lot 16.
 *
 * Les quatre entrées ci-dessous et les quatre lignes de `core_values`
 * coïncident donc exactement à ce jour — titre, explication, icône, teinte,
 * ordre — ce que la recette du Lot 8E vérifie champ par champ. C'est ce qui
 * rend démontrable le critère « rendu public identique pour les données
 * migrées », et c'est aussi pourquoi le fichier ne doit pas être modifié pour
 * y refléter un changement fait au dashboard : il serait alors une seconde
 * source de vérité, et la comparaison perdrait tout son sens.
 *
 * `icon` y est resté un COMPOSANT React (`icon: HeartHandshake`) : c'est
 * précisément ce que la base ne peut pas stocker, et la différence que
 * `icon-registry.ts` fait disparaître. Voir l'en-tête de `core-value.ts`.
 *
 * Les 4 valeurs de l'association, telles qu'énoncées par ADEBES.
 */
export const valeurs: Valeur[] = [
  {
    title: "Solidarité",
    description: "L'union fait la force : chaque geste compte.",
    icon: HeartHandshake,
    tone: "blue",
  },
  {
    title: "Respect",
    description: "Chaque individu est traité avec dignité, sans distinction.",
    icon: ShieldCheck,
    tone: "navy",
  },
  {
    title: "Innovation",
    description: "Des approches créatives pour maximiser l'impact.",
    icon: Lightbulb,
    tone: "orange",
  },
  {
    title: "Impact social",
    description: "Des résultats mesurés et durables.",
    icon: TrendingUp,
    tone: "green",
  },
];
