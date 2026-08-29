"use client";

import { motion, useReducedMotion } from "motion/react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Animation d'entrée discrète : fondu + 16 px de déplacement, 0.5 s, ease-out.
 *
 * Règles appliquées (section 9 du cahier des charges) :
 * - `once: true` — l'animation ne rejoue pas aux allers-retours de scroll ;
 * - `prefers-reduced-motion` désactive complètement l'effet ;
 * - à n'utiliser **que sous la ligne de flottaison**. Le contenu critique du
 *   hero est rendu sans animation, pour être lisible au premier octet.
 *
 * Les utilisateurs sans JavaScript voient le contenu normalement : la règle
 * `<noscript>` posée dans le layout racine neutralise l'état initial.
 */
export function Reveal({
  children,
  delay = 0,
  className,
  as = "div",
}: {
  children: ReactNode;
  /** Décalage en secondes, pour un effet d'escalier sur une grille. */
  delay?: number;
  className?: string;
  as?: "div" | "section" | "li" | "article";
}) {
  const reduceMotion = useReducedMotion();
  const Tag = motion[as];

  if (reduceMotion) {
    const Plain = as;
    return <Plain className={className}>{children}</Plain>;
  }

  return (
    <Tag
      data-reveal=""
      className={cn(className)}
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      transition={{ duration: 0.5, delay, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </Tag>
  );
}
