import { Info } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Marque explicitement un contenu de démonstration.
 *
 * Un gabarit non signalé finit toujours par être pris pour un contenu réel.
 * Pour une association qui collecte des dons, laisser passer un faux
 * témoignage ou un faux chiffre serait bien plus grave qu'un site incomplet :
 * ce badge rend l'état provisoire impossible à manquer.
 */
export function PlaceholderBadge({
  children = "Exemple — à remplacer",
  className,
}: {
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border border-brand-orange/40 bg-brand-orange/10 px-2.5 py-1 text-[0.7rem] font-medium leading-none text-brand-orange-ink dark:text-brand-orange",
        className,
      )}
    >
      <Info className="size-3" aria-hidden="true" />
      {children}
    </span>
  );
}
