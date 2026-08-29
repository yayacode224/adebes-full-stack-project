"use client";

import { animate, useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

const format = new Intl.NumberFormat("fr-FR");

/**
 * Compteur chiffré.
 *
 * Point clé : **la valeur finale est rendue par le serveur**. Sans JavaScript,
 * avec un JavaScript lent, ou pour un moteur de recherche, le HTML contient
 * déjà le bon chiffre. L'animation ne fait que l'accompagner visuellement au
 * moment où le compteur entre dans le champ de vision.
 *
 * C'est exactement l'inverse de l'ancien site, dont les compteurs affichaient
 * « 0 » dans le HTML (constat #7 de l'audit).
 */
export function AnimatedCounter({
  value,
  suffix,
  className,
}: {
  value: number;
  suffix?: string;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.4 });
  const reduceMotion = useReducedMotion();
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    if (!inView || reduceMotion) return;

    const controls = animate(0, value, {
      duration: 1.1,
      ease: [0.16, 1, 0.3, 1],
      onUpdate: (latest) => setDisplay(Math.round(latest)),
    });

    return () => controls.stop();
  }, [inView, value, reduceMotion]);

  return (
    <span ref={ref} className={className}>
      {format.format(display)}
      {suffix}
    </span>
  );
}
