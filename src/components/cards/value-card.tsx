import { ContentIcon } from "@/components/ui-ext/content-icon";
import type { CoreValue } from "@/core/cms/entities/core-value";
import type { MediaTone } from "@/core/cms/entities/media-tone";
import { cn } from "@/lib/utils";

/**
 * La carte d'une valeur de l'association.
 *
 * ---------------------------------------------------------------------------
 * CE QUI CHANGE AU LOT 8E — ET CE QUI NE CHANGE PAS
 * ---------------------------------------------------------------------------
 * La carte lisait `Valeur` (`src/content/valeurs.ts`), dont le champ `icon`
 * était un COMPOSANT React (`icon: HeartHandshake`). Elle lit maintenant les
 * champs correspondants de `CoreValue`, où `icon` est un NOM
 * (« HeartHandshake ») résolu au rendu par `<ContentIcon>` — même pont qu'au
 * Lot 8A pour les programmes.
 *
 * **Le balisage produit est identique, à l'octet près.** C'est un critère de
 * recette des lots 8x (« le rendu public est identique à l'actuel pour les
 * données migrées »), et il est vérifiable ici parce que rien d'autre n'a
 * bougé : mêmes classes, même ordre, même `aria-hidden` sur l'icône.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LA PROP N'EST PAS UN `CoreValue` COMPLET
 * ---------------------------------------------------------------------------
 * Un `Pick` des quatre champs réellement affichés. La carte n'a que faire de
 * `id`, `position`, `isVisible` ou des horodatages — et l'aperçu du formulaire
 * de saisie (`value-form.tsx`) n'en dispose pas : il montre ce qui est en train
 * d'être tapé, pas une ligne de la base.
 *
 * Exiger l'entité entière aurait obligé à fabriquer un faux identifiant et un
 * faux `createdAt` pour dessiner un aperçu. Le type dit donc exactement ce que
 * la carte lit, ni plus.
 */
export type ValeurAffichable = Pick<
  CoreValue,
  "title" | "description" | "icon" | "tone"
>;

const TONE_CLASSES: Record<MediaTone, string> = {
  navy: "bg-brand-navy/10 text-brand-navy dark:bg-white/10 dark:text-white",
  blue: "bg-brand-blue/12 text-brand-blue-ink dark:bg-brand-blue/20 dark:text-[#8fcdf0]",
  green:
    "bg-brand-green/12 text-brand-green-ink dark:bg-brand-green/20 dark:text-[#8fdc93]",
  orange:
    "bg-brand-orange/15 text-brand-orange-ink dark:bg-brand-orange/20 dark:text-brand-orange",
  neutral: "bg-muted text-muted-foreground",
};

export function ValueCard({
  valeur,
  className,
}: {
  valeur: ValeurAffichable;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex h-full flex-col gap-3 rounded-2xl border border-border bg-card p-5 transition-shadow duration-300 hover:shadow-md motion-reduce:transition-none",
        className,
      )}
    >
      <span
        className={cn(
          "grid size-11 place-items-center rounded-xl",
          TONE_CLASSES[valeur.tone],
        )}
      >
        {/*
          `<ContentIcon>` plutôt que `const Icon = getIcon(...)` : la règle
          `react-hooks/static-components` refuse toute valeur de composant
          renvoyée par un APPEL pendant le rendu (écart nº 32). Le composant
          fait l'accès par propriété une fois pour toutes.
        */}
        <ContentIcon name={valeur.icon} className="size-5" />
      </span>

      <h3 className="font-heading text-base font-semibold text-foreground">
        {valeur.title}
      </h3>

      <p className="text-sm leading-relaxed text-muted-foreground">
        {valeur.description}
      </p>
    </div>
  );
}
