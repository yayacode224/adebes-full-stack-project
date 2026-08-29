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

/** Les 4 valeurs de l'association, telles qu'énoncées par ADEBES. */
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
