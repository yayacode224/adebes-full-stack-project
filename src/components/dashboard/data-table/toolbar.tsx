"use client";

import { ListFilter, Search, X } from "lucide-react";
import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetTrigger,
} from "@/components/ui/sheet";
import { CHAMP, CHAMP_SELECT } from "@/components/dashboard/forms/field-styles";
import { cn } from "@/lib/utils";

import type { FilterDescriptor } from "./types";

/**
 * Barre d'outils : recherche et filtres.
 *
 * ---------------------------------------------------------------------------
 * DEUX PRÉSENTATIONS (§6.1)
 * ---------------------------------------------------------------------------
 * | Élément   | < 768 px                                     | ≥ 768 px      |
 * |-----------|----------------------------------------------|---------------|
 * | Recherche | pleine largeur, TOUJOURS visible              | dans la barre |
 * | Filtres   | bouton « Filtrer » ouvrant un `Sheet`, avec   | en ligne      |
 * |           | un compteur de filtres actifs                |               |
 *
 * La recherche reste visible au téléphone parce qu'elle est l'outil le plus
 * utilisé d'une liste ; les filtres, plus rares, peuvent coûter un appui.
 * L'inverse — masquer la recherche pour gagner de la place — obligerait à deux
 * appuis l'action la plus fréquente.
 *
 * ---------------------------------------------------------------------------
 * LE COMPTEUR DE FILTRES ACTIFS N'EST PAS DÉCORATIF
 * ---------------------------------------------------------------------------
 * Les filtres étant repliés dans un tiroir sous 768 px, rien n'indiquerait
 * qu'une liste est filtrée : l'utilisateur conclurait que ses données ont
 * disparu. Le compteur, et le bouton « Tout effacer » qui l'accompagne, sont
 * ce qui rend la situation réversible.
 */
export function DataTableToolbar<T>({
  recherche,
  onRecherche,
  placeholder,
  filtres,
  valeursDeFiltre,
  onFiltre,
  onEffacerFiltres,
}: {
  recherche: string;
  onRecherche: (valeur: string) => void;
  placeholder?: string;
  filtres: FilterDescriptor<T>[];
  valeursDeFiltre: Record<string, string>;
  onFiltre: (cle: string, valeur: string) => void;
  onEffacerFiltres: () => void;
}) {
  const [tiroirOuvert, setTiroirOuvert] = useState(false);

  const actifs = Object.values(valeursDeFiltre).filter(Boolean).length;
  const avecRecherche = placeholder !== undefined;

  if (!avecRecherche && filtres.length === 0) return null;

  const controles = (
    <div className="flex flex-col gap-3">
      {filtres.map((filtre) => (
        <div key={filtre.key} className="flex flex-col gap-1.5">
          <label
            htmlFor={`filtre-${filtre.key}`}
            className="text-sm font-medium"
          >
            {filtre.label}
          </label>
          <Select
            value={valeursDeFiltre[filtre.key] ?? TOUS}
            onValueChange={(valeur) =>
              onFiltre(filtre.key, valeur === TOUS ? "" : valeur)
            }
          >
            <SelectTrigger id={`filtre-${filtre.key}`} className={CHAMP_SELECT}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {/*
                Radix interdit une `value` vide sur un `SelectItem` : elle est
                réservée à l'effacement de la sélection. « Tous » porte donc
                une valeur sentinelle, retraduite en chaîne vide ci-dessus.
              */}
              <SelectItem value={TOUS} className="min-h-11">
                Tous
              </SelectItem>
              {filtre.options.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  className="min-h-11"
                >
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ))}
    </div>
  );

  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
      {avecRecherche ? (
        <div className="relative w-full md:max-w-xs">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={recherche}
            onChange={(evenement) => onRecherche(evenement.target.value)}
            placeholder={placeholder}
            aria-label={placeholder}
            className={cn(CHAMP, "pl-9")}
          />
        </div>
      ) : (
        <span />
      )}

      {filtres.length > 0 ? (
        <>
          {/* --- ≥ 768 px : filtres en ligne ----------------------------- */}
          <div className="hidden items-end gap-3 md:flex">
            {controles}

            {actifs > 0 ? (
              <Button
                type="button"
                variant="ghost"
                onClick={onEffacerFiltres}
                className="shrink-0"
              >
                <X className="size-4" aria-hidden="true" />
                Tout effacer
              </Button>
            ) : null}
          </div>

          {/* --- < 768 px : tiroir « Filtrer » --------------------------- */}
          <Sheet open={tiroirOuvert} onOpenChange={setTiroirOuvert}>
            <SheetTrigger asChild>
              <Button type="button" variant="outline" className="w-full md:hidden">
                <ListFilter className="size-4" aria-hidden="true" />
                Filtrer
                {actifs > 0 ? (
                  <span className="ml-1 inline-flex size-5 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                    {actifs}
                  </span>
                ) : null}
              </Button>
            </SheetTrigger>

            <SheetContent
              side="bottom"
              className="gap-0 rounded-t-xl p-0 data-[side=bottom]:max-h-[85dvh]"
            >
              <SheetHeader className="border-b border-border px-4 py-3">
                <SheetTitle>Filtrer la liste</SheetTitle>
                <SheetDescription>
                  {actifs === 0
                    ? "Aucun filtre actif."
                    : `${actifs} filtre${actifs > 1 ? "s" : ""} actif${actifs > 1 ? "s" : ""}.`}
                </SheetDescription>
              </SheetHeader>

              <div className="overflow-y-auto px-4 py-4">{controles}</div>

              <div className="flex flex-col gap-2 border-t border-border px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))]">
                <Button
                  type="button"
                  variant="ghost"
                  onClick={onEffacerFiltres}
                  disabled={actifs === 0}
                >
                  Tout effacer
                </Button>
                <Button type="button" onClick={() => setTiroirOuvert(false)}>
                  Voir les résultats
                </Button>
              </div>
            </SheetContent>
          </Sheet>
        </>
      ) : null}
    </div>
  );
}

/** Valeur sentinelle de l'option « Tous » — Radix refuse une `value` vide. */
export const TOUS = "__tous__";
