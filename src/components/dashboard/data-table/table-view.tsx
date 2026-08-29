"use client";

import { ArrowDown, ArrowUp, ArrowUpDown } from "lucide-react";

import { Checkbox } from "@/components/ui/checkbox";
import { CIBLE_44 } from "@/components/dashboard/forms/field-styles";
import {
  ReorderHandle,
  ReorderProvider,
  useElementTriable,
} from "@/components/dashboard/shared/reorder";
import { cn } from "@/lib/utils";

import { RowActionsMenu } from "./row-actions";
import type { Column, EtatDeTri, RowAction } from "./types";

/**
 * Le tableau — à partir de 768 px seulement.
 *
 * ---------------------------------------------------------------------------
 * IL N'EST PAS RENDU DU TOUT SOUS 768 px
 * ---------------------------------------------------------------------------
 * Ce n'est pas un `hidden md:table` : le composant n'est pas monté. Le §6.1
 * l'exige — « rendre les deux formes en parallèle et en cacher une doublerait
 * le DOM et les lecteurs d'écran liraient tout deux fois ». La bascule est
 * faite par `useIsTableViewport()` dans `data-table.tsx`.
 *
 * ---------------------------------------------------------------------------
 * LE DÉFILEMENT HORIZONTAL A LIEU DANS LE CONTENEUR, JAMAIS DANS LA PAGE
 * ---------------------------------------------------------------------------
 * Règle 3 du §12. Le conteneur porte `overflow-x-auto` ; la page, elle, ne
 * défile jamais latéralement — c'est le critère de recette binaire du lot.
 *
 * ---------------------------------------------------------------------------
 * `aria-sort` PLUTÔT QU'UNE FLÈCHE SEULE
 * ---------------------------------------------------------------------------
 * La flèche dit le sens du tri à l'œil. `aria-sort` le dit au lecteur d'écran,
 * et l'en-tête est un vrai `<button>` : sans lui, la colonne serait triable à
 * la souris et pas au clavier.
 */
export function TableView<T>({
  rows,
  columns,
  getRowId,
  tri,
  onTri,
  selection,
  onSelection,
  rowActions,
  reorderIds,
  onReorder,
  reorderBloque,
  libelleDeLigne,
}: {
  rows: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  tri: EtatDeTri;
  onTri: (cle: string) => void;
  /** `null` quand la sélection multiple n'est pas activée. */
  selection: Set<string> | null;
  onSelection: (ids: Set<string>) => void;
  rowActions?: (row: T) => RowAction[];
  /** `null` quand le réordonnancement n'est pas activé. */
  reorderIds: string[] | null;
  onReorder: (ordre: string[]) => void;
  /** Motif pour lequel le glisser-déposer est momentanément impossible. */
  reorderBloque?: string;
  libelleDeLigne: (row: T) => string;
}) {
  const avecSelection = selection !== null;
  const avecReordonnancement = reorderIds !== null;

  const idsAffiches = rows.map(getRowId);
  const toutesCochees =
    avecSelection &&
    idsAffiches.length > 0 &&
    idsAffiches.every((id) => selection.has(id));
  const partiellement =
    avecSelection && !toutesCochees && idsAffiches.some((id) => selection.has(id));

  function basculerTout(coche: boolean) {
    if (!avecSelection) return;
    const suivante = new Set(selection);
    for (const id of idsAffiches) {
      if (coche) suivante.add(id);
      else suivante.delete(id);
    }
    onSelection(suivante);
  }

  function basculerLigne(id: string) {
    if (!avecSelection) return;
    const suivante = new Set(selection);
    if (suivante.has(id)) suivante.delete(id);
    else suivante.add(id);
    onSelection(suivante);
  }

  const corps = (
    <tbody>
      {rows.map((row) => {
        const id = getRowId(row);
        return (
          <LigneDeTableau
            key={id}
            id={id}
            row={row}
            columns={columns}
            triable={avecReordonnancement}
            reorderBloque={reorderBloque}
            libelle={libelleDeLigne(row)}
            cochee={avecSelection ? selection.has(id) : null}
            onBasculer={() => basculerLigne(id)}
            actions={rowActions?.(row)}
          />
        );
      })}
    </tbody>
  );

  const tableau = (
    /*
      ⚠️  `relative` N'EST PAS DÉCORATIF — CORRECTIF DU LOT 8A.

      Sans lui, le `<span class="sr-only">Ordre</span>` de l'en-tête, qui est
      `position: absolute`, prend pour bloc conteneur le bloc conteneur INITIAL
      (aucun ancêtre n'étant positionné). Il échappe alors au découpage de
      `overflow-x-auto` et étend la zone défilante de la PAGE : mesuré à
      1024 px, `document.documentElement.scrollWidth` valait 1257 pour une
      fenêtre de 1024, et la page défilait réellement de 248 px — exactement ce
      que la règle 2 du §12 interdit.

      Le défaut dormait depuis le Lot 6 : il n'apparaît que lorsque le tableau
      est plus large que son conteneur, ce qui arrive pour la première fois
      avec les huit colonnes de cet écran. Avec `relative`, le bloc conteneur
      de tout descendant absolu redevient ce conteneur, qui le découpe.
    */
    <div className="relative overflow-x-auto rounded-xl border border-border">
      <table className="w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-border bg-muted/40 text-left">
            {avecSelection ? (
              <th scope="col" className="w-11 px-3 py-2">
                <Checkbox
                  checked={toutesCochees ? true : partiellement ? "indeterminate" : false}
                  onCheckedChange={(coche) => basculerTout(coche === true)}
                  aria-label="Tout sélectionner sur cette page"
                  className={CIBLE_44}
                />
              </th>
            ) : null}

            {avecReordonnancement ? (
              <th scope="col" className="w-11 px-1 py-2">
                <span className="sr-only">Ordre</span>
              </th>
            ) : null}

            {columns.map((colonne) => (
              <th
                key={colonne.key}
                scope="col"
                style={colonne.width ? { width: colonne.width } : undefined}
                aria-sort={
                  tri?.key === colonne.key
                    ? tri.sens === "asc"
                      ? "ascending"
                      : "descending"
                    : colonne.sortable
                      ? "none"
                      : undefined
                }
                className={cn(
                  "px-3 py-2 font-medium text-muted-foreground",
                  colonne.align === "end" && "text-right",
                  // Masquée entre 768 et 1024 px (§6.1). Sous 768 px la
                  // question ne se pose pas : ce sont des cartes.
                  colonne.hideOnMobile && "hidden lg:table-cell",
                )}
              >
                {colonne.sortable ? (
                  <button
                    type="button"
                    onClick={() => onTri(colonne.key)}
                    className="inline-flex min-h-11 items-center gap-1.5 rounded-md py-1 text-left transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    {colonne.header}
                    <IconeDeTri
                      actif={tri?.key === colonne.key}
                      sens={tri?.sens ?? "asc"}
                    />
                  </button>
                ) : (
                  colonne.header
                )}
              </th>
            ))}

            {rowActions ? (
              <th scope="col" className="w-14 px-3 py-2 text-right">
                <span className="sr-only">Actions</span>
              </th>
            ) : null}
          </tr>
        </thead>

        {corps}
      </table>
    </div>
  );

  if (!avecReordonnancement) return tableau;

  return (
    <ReorderProvider ids={reorderIds} onReorder={onReorder} disabled={!!reorderBloque}>
      {tableau}
    </ReorderProvider>
  );
}

function LigneDeTableau<T>({
  id,
  row,
  columns,
  triable,
  reorderBloque,
  libelle,
  cochee,
  onBasculer,
  actions,
}: {
  id: string;
  row: T;
  columns: Column<T>[];
  triable: boolean;
  reorderBloque?: string;
  libelle: string;
  cochee: boolean | null;
  onBasculer: () => void;
  actions?: RowAction[];
}) {
  const { attributes, listeners, setNodeRef, setActivatorNodeRef, style, isDragging } =
    useElementTriable(id, !triable || !!reorderBloque);

  return (
    <tr
      ref={triable ? setNodeRef : undefined}
      style={triable ? style : undefined}
      className={cn(
        "border-b border-border last:border-b-0",
        cochee ? "bg-primary/5" : "hover:bg-muted/40",
        isDragging && "bg-card shadow-lg",
      )}
    >
      {cochee !== null ? (
        <td className="px-3 py-2">
          <Checkbox
            checked={cochee}
            onCheckedChange={onBasculer}
            aria-label={`Sélectionner ${libelle}`}
            className={CIBLE_44}
          />
        </td>
      ) : null}

      {triable ? (
        <td className="px-1 py-1">
          <ReorderHandle
            label={`Déplacer ${libelle}`}
            disabled={!!reorderBloque}
            disabledReason={reorderBloque}
            setActivatorNodeRef={setActivatorNodeRef}
            attributes={attributes}
            listeners={listeners}
          />
        </td>
      ) : null}

      {columns.map((colonne) => (
        <td
          key={colonne.key}
          className={cn(
            "px-3 py-2 align-middle",
            colonne.align === "end" && "text-right",
            colonne.hideOnMobile && "hidden lg:table-cell",
          )}
        >
          {colonne.cell(row)}
        </td>
      ))}

      {actions ? (
        <td className="px-3 py-1 text-right">
          <RowActionsMenu actions={actions} label={`Actions pour ${libelle}`} />
        </td>
      ) : null}
    </tr>
  );
}

function IconeDeTri({ actif, sens }: { actif: boolean; sens: "asc" | "desc" }) {
  if (!actif) {
    return (
      <ArrowUpDown className="size-3.5 shrink-0 opacity-50" aria-hidden="true" />
    );
  }
  return sens === "asc" ? (
    <ArrowUp className="size-3.5 shrink-0" aria-hidden="true" />
  ) : (
    <ArrowDown className="size-3.5 shrink-0" aria-hidden="true" />
  );
}
