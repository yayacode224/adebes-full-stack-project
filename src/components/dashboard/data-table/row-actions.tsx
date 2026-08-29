"use client";

import { MoreHorizontal } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

import type { RowAction } from "./types";

/**
 * Menu d'actions d'une ligne.
 *
 * ---------------------------------------------------------------------------
 * RIEN AU SURVOL (règle 8 du §12 du Rapport 1)
 * ---------------------------------------------------------------------------
 * Le menu s'ouvre au CLIC, jamais au survol, et le déclencheur est visible en
 * permanence — pas révélé par le survol de la ligne, comme le font beaucoup de
 * tableaux. Sur un écran tactile, il n'y a pas de survol : une action
 * découvrable seulement ainsi est une action absente.
 *
 * ---------------------------------------------------------------------------
 * 44 px, ICI PLUS QU'AILLEURS
 * ---------------------------------------------------------------------------
 * Le §12 nomme explicitement « les cellules d'action d'un tableau » parmi les
 * cibles à ne jamais rétrécir. Le déclencheur est en `size="icon"` (44 px) et
 * chaque entrée du menu en `min-h-11` — les éléments shadcn sont en `py-1`,
 * soit ≈ 28 px.
 *
 * ---------------------------------------------------------------------------
 * UNE ACTION DÉSACTIVÉE DIT POURQUOI
 * ---------------------------------------------------------------------------
 * « Monter » sur la première ligne, « Supprimer » sans la permission : une
 * entrée grisée et muette laisse croire à une panne. `disabledReason` est
 * rendu en texte, à l'intérieur de l'entrée — pas en `title`, qui n'existe pas
 * au doigt.
 */
export function RowActionsMenu({
  actions,
  label,
}: {
  actions: RowAction[];
  /** Nomme la ligne : « Actions pour Éducation ». */
  label: string;
}) {
  if (actions.length === 0) return null;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={label}
        >
          <MoreHorizontal className="size-4" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-56">
        {actions.map((action) => {
          const Icone = action.icon;

          return (
            <DropdownMenuItem
              key={action.label}
              disabled={action.disabled}
              variant={action.variant === "destructive" ? "destructive" : "default"}
              onSelect={action.onSelect}
              className={cn("min-h-11 gap-2 px-2", action.disabled && "flex-col items-start justify-center gap-0")}
            >
              <span className="flex items-center gap-2">
                {Icone ? <Icone className="size-4" aria-hidden="true" /> : null}
                {action.label}
              </span>

              {action.disabled && action.disabledReason ? (
                <span className="text-xs font-normal text-muted-foreground">
                  {action.disabledReason}
                </span>
              ) : null}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
