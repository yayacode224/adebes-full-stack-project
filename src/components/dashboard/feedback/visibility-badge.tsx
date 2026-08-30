import { libelleVisibilite } from "@/core/cms/entities/visibility";
import { cn } from "@/lib/utils";

/**
 * Une valeur est-elle affichée sur le site ?
 *
 * Le pendant de `<StatusBadge>` pour les collections sans cycle éditorial
 * (`core_values` au Lot 8E, `stats` au Lot 8G). Deux états, pas quatre.
 *
 * ---------------------------------------------------------------------------
 * COULEUR **ET** LIBELLÉ — JAMAIS LA COULEUR SEULE
 * ---------------------------------------------------------------------------
 * Contrainte d'accessibilité du projet (§12 du Rapport 1), pas une préférence
 * esthétique : une pastille verte muette ne dit rien à une personne daltonienne,
 * et rien du tout à un lecteur d'écran. Le libellé est du texte, toujours rendu,
 * jamais un `title` ni un `aria-label` compensatoire.
 *
 * Seconde redondance, comme sur `<StatusBadge>` : le point est PLEIN quand la
 * valeur est en ligne, ATTÉNUÉ quand elle ne l'est pas, et la bordure passe de
 * pleine à TIRETÉE. Les deux états restent distinguables en niveaux de gris.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUNE COULEUR N'EST INVENTÉE ICI
 * ---------------------------------------------------------------------------
 * Les deux couples sont repris tels quels de `<StatusBadge>`, où ils ont été
 * MESURÉS et corrigés à la suite d'un échec de recette :
 *
 *   * `bg-accent` / `text-accent-foreground` — la paire verte opaque de
 *     `globals.css`, conçue l'une pour l'autre : 7,2:1 en clair, 8,4:1 en
 *     sombre. C'est celle qui a remplacé un `bg-success/12` translucide mesuré
 *     à 4,08:1, sous le seuil AA ;
 *   * bordure tiretée sans fond, `text-muted-foreground` sur la surface :
 *     4,9:1, là où le même texte sur `bg-muted` opaque tombait à 4,42:1.
 *
 * La règle qui en découle vaut pour tout ce que les lots suivants ajouteront :
 * **pas de texte sur un fond translucide non mesuré.** Réutiliser une paire
 * déjà mesurée vaut mieux que d'en composer une nouvelle qu'il faudrait
 * remesurer.
 */
export function VisibilityBadge({
  isVisible,
  className,
}: {
  isVisible: boolean;
  className?: string;
}) {
  return (
    <span
      data-visible={isVisible}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        isVisible
          ? "border-accent-foreground/25 bg-accent text-accent-foreground"
          : "border-dashed border-border text-muted-foreground",
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn(
          "size-1.5 shrink-0 rounded-full",
          isVisible ? "bg-success" : "bg-muted-foreground/50",
        )}
      />
      {libelleVisibilite(isVisible)}
    </span>
  );
}
