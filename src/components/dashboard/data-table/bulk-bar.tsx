"use client";

import { X } from "lucide-react";

import { Button } from "@/components/ui/button";

import type { BulkAction } from "./types";

/**
 * Barre d'actions groupées.
 *
 * ---------------------------------------------------------------------------
 * FIXÉE EN BAS SOUS 768 px, AU-DESSUS DE LA ZONE SÛRE
 * ---------------------------------------------------------------------------
 * §6.1 : « barre fixée en bas + `env(safe-area-inset-bottom)` » au téléphone,
 * « barre sous l'en-tête du tableau » au-delà. La sélection se fait en haut de
 * liste et l'action s'applique après avoir fait défiler : une barre qui reste
 * en haut de page sort de l'écran au premier défilement, et l'utilisateur croit
 * sa sélection perdue.
 *
 * `pb-[calc(...+env(safe-area-inset-bottom))]` et non `pb-action-bar` : cette
 * classe-là est dimensionnée pour la `StickyMobileActionBar` du site public,
 * absente du dashboard (§12, règle 6).
 *
 * ---------------------------------------------------------------------------
 * `role="region"` ET UN COMPTEUR ANNONCÉ
 * ---------------------------------------------------------------------------
 * La barre apparaît en cours de navigation, sans que l'utilisateur ait changé
 * d'écran. Sans annonce, une personne au lecteur d'écran coche des lignes sans
 * jamais apprendre qu'une barre d'actions vient de s'ouvrir.
 */
export function BulkActionsBar({
  count,
  actions,
  onAction,
  onClear,
}: {
  count: number;
  actions: BulkAction[];
  onAction: (action: BulkAction) => void;
  onClear: () => void;
}) {
  if (count === 0) return null;

  return (
    <div
      role="region"
      aria-label="Actions sur la sélection"
      className={[
        // Mobile : fixée au bas de la fenêtre, au-dessus de la zone sûre.
        "fixed inset-x-0 bottom-0 z-40 flex flex-col gap-2 border-t border-border bg-card px-4 py-3 shadow-lg",
        "pb-[calc(0.75rem+env(safe-area-inset-bottom))]",
        // ≥ 768 px : elle reprend sa place dans le flux, sous la barre d'outils.
        "md:static md:z-auto md:flex-row md:items-center md:rounded-lg md:border md:pb-3 md:shadow-none",
      ].join(" ")}
    >
      <p aria-live="polite" className="text-sm font-medium md:mr-auto">
        {count} élément{count > 1 ? "s" : ""} sélectionné{count > 1 ? "s" : ""}
      </p>

      <div className="flex flex-col gap-2 sm:flex-row [&>*]:w-full sm:[&>*]:w-auto">
        {actions.map((action) => {
          const Icone = action.icon;
          return (
            <Button
              key={action.key}
              type="button"
              variant={action.variant === "destructive" ? "destructive" : "outline"}
              onClick={() => onAction(action)}
            >
              {Icone ? <Icone className="size-4" aria-hidden="true" /> : null}
              {action.label}
            </Button>
          );
        })}

        <Button type="button" variant="ghost" onClick={onClear}>
          <X className="size-4" aria-hidden="true" />
          Annuler la sélection
        </Button>
      </div>
    </div>
  );
}
