import { Inbox, type LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Écran vide.
 *
 * ---------------------------------------------------------------------------
 * « JAMAIS UN TABLEAU VIDE MUET » (§12 du Rapport 1)
 * ---------------------------------------------------------------------------
 * Un écran sans contenu est le moment où l'utilisateur non technique décroche :
 * il ne sait pas s'il a mal cherché, si le site est cassé, ou s'il n'y a
 * simplement rien. Les trois éléments ci-dessous répondent chacun à une de ces
 * questions, et `action` est ce qui transforme un cul-de-sac en première
 * étape.
 *
 * `description` et `action` ne sont pas facultatifs par confort : ils sont
 * obligatoires dans l'esprit du §12. `action` reste optionnel dans la
 * signature pour le seul cas légitime — un résultat de recherche vide, où la
 * bonne action est de modifier la recherche, pas de créer un élément.
 */
export function EmptyState({
  title,
  description,
  action,
  icon: Icone = Inbox,
  className,
}: {
  title: string;
  description: string;
  action?: ReactNode;
  icon?: LucideIcon;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-10 text-center sm:px-6",
        className,
      )}
    >
      <Icone className="size-8 text-muted-foreground" aria-hidden="true" />

      <div className="space-y-1">
        <p className="font-heading text-base font-semibold text-foreground">
          {title}
        </p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">
          {description}
        </p>
      </div>

      {/*
        Pleine largeur sous `sm:` : sur un téléphone, un bouton centré de
        120 px est une cible que le pouce rate une fois sur trois.
      */}
      {action ? (
        <div className="mt-1 flex w-full flex-col gap-2 sm:w-auto sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">
          {action}
        </div>
      ) : null}
    </div>
  );
}
