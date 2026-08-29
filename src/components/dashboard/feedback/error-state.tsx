"use client";

import { RotateCw, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * État d'erreur d'une zone de contenu.
 *
 * Distinct de `<EmptyState>` — et la distinction est tout l'intérêt : « il n'y
 * a rien » et « on n'a pas pu savoir » appellent deux réactions opposées.
 * Confondre les deux, c'est laisser un utilisateur créer un doublon parce
 * qu'une liste s'est affichée vide sur une erreur réseau.
 *
 * `role="alert"` : l'erreur apparaît après une action, elle doit être annoncée
 * sans attendre que l'utilisateur retrouve la zone au lecteur d'écran. Icône
 * **et** texte, jamais la couleur seule.
 *
 * Le bouton « Réessayer » est optionnel dans la signature seulement : il n'a
 * pas de sens quand rien n'est rejouable. Le §6.1 l'exige pour `<DataTable>`,
 * qui le fournit toujours.
 *
 * ---------------------------------------------------------------------------
 * FOND OPAQUE, PAS DE LAVIS ROUGE
 * ---------------------------------------------------------------------------
 * La première version posait `bg-destructive/5` derrière le message. Mesuré en
 * recette : `text-muted-foreground` y tombait à **4,39:1**, sous le seuil AA,
 * alors qu'il vaut 5,1:1 sur le fond de carte. Le lavis coûtait sept centièmes
 * de contraste pour un signal que la bordure, l'icône et le titre portent
 * déjà — et le §12 interdit de toute façon de faire porter une information par
 * la seule couleur.
 */
export function ErrorState({
  title = "Impossible d'afficher ces données",
  message,
  onRetry,
  className,
}: {
  title?: string;
  message: string;
  onRetry?: () => void;
  className?: string;
}) {
  return (
    <div
      role="alert"
      className={cn(
        "flex flex-col items-center gap-3 rounded-xl border border-destructive/40 bg-card px-4 py-10 text-center sm:px-6",
        className,
      )}
    >
      <TriangleAlert className="size-8 text-destructive" aria-hidden="true" />

      <div className="space-y-1">
        <p className="font-heading text-base font-semibold text-foreground">
          {title}
        </p>
        <p className="mx-auto max-w-md text-sm text-muted-foreground">{message}</p>
      </div>

      {onRetry ? (
        <Button
          type="button"
          variant="outline"
          onClick={onRetry}
          className="mt-1 w-full sm:w-auto"
        >
          <RotateCw className="size-4" aria-hidden="true" />
          Réessayer
        </Button>
      ) : null}
    </div>
  );
}
