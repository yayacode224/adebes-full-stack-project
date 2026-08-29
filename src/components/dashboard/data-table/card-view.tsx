"use client";

import { Checkbox } from "@/components/ui/checkbox";
import { CIBLE_44 } from "@/components/dashboard/forms/field-styles";
import {
  ReorderHandle,
  ReorderProvider,
  useElementTriable,
} from "@/components/dashboard/shared/reorder";
import { cn } from "@/lib/utils";

import { RowActionsMenu } from "./row-actions";
import type { Column, RowAction } from "./types";

/**
 * La liste de cartes — sous 768 px seulement.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI DES CARTES, ET PAS UN TABLEAU QUI DÉFILE
 * ---------------------------------------------------------------------------
 * « Un tableau à défilement horizontal comme seule réponse au mobile » est un
 * INTERDIT explicite du §12 : la colonne d'identification sort de l'écran et
 * l'utilisateur ne sait plus quelle ligne il manipule. Sur un écran de 360 px,
 * un tableau de six colonnes est illisible quoi qu'on fasse.
 *
 * ---------------------------------------------------------------------------
 * COMPOSITION D'UNE CARTE (§6.1)
 * ---------------------------------------------------------------------------
 * | Emplacement  | Contenu                                                  |
 * |--------------|----------------------------------------------------------|
 * | Ligne 1      | colonne primaire (titre) + colonne « badge » (statut)     |
 * | Ligne 2      | DEUX métadonnées au maximum                               |
 * | Coin         | menu d'actions, cible ≥ 44 px                             |
 * | Bord gauche  | poignée de réordonnancement, si activé                    |
 *
 * Deux métadonnées, pas trois : une carte qui reprend les six colonnes du
 * tableau redevient un tableau, en plus haut. Les colonnes surnuméraires ne
 * sont pas perdues — elles reviennent dès 768 px.
 */
export function CardView<T>({
  rows,
  getRowId,
  primaryColumn,
  badgeColumn,
  metaColumns,
  selection,
  onSelection,
  rowActions,
  reorderIds,
  onReorder,
  reorderBloque,
  libelleDeLigne,
}: {
  rows: T[];
  getRowId: (row: T) => string;
  primaryColumn: Column<T>;
  badgeColumn: Column<T> | null;
  metaColumns: Column<T>[];
  selection: Set<string> | null;
  onSelection: (ids: Set<string>) => void;
  rowActions?: (row: T) => RowAction[];
  reorderIds: string[] | null;
  onReorder: (ordre: string[]) => void;
  reorderBloque?: string;
  libelleDeLigne: (row: T) => string;
}) {
  const avecSelection = selection !== null;
  const avecReordonnancement = reorderIds !== null;

  function basculerLigne(id: string) {
    if (!avecSelection) return;
    const suivante = new Set(selection);
    if (suivante.has(id)) suivante.delete(id);
    else suivante.add(id);
    onSelection(suivante);
  }

  const liste = (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => {
        const id = getRowId(row);
        return (
          <CarteDeLigne
            key={id}
            id={id}
            row={row}
            primaryColumn={primaryColumn}
            badgeColumn={badgeColumn}
            metaColumns={metaColumns}
            triable={avecReordonnancement}
            reorderBloque={reorderBloque}
            libelle={libelleDeLigne(row)}
            cochee={avecSelection ? selection.has(id) : null}
            onBasculer={() => basculerLigne(id)}
            actions={rowActions?.(row)}
          />
        );
      })}
    </ul>
  );

  if (!avecReordonnancement) return liste;

  return (
    <ReorderProvider ids={reorderIds} onReorder={onReorder} disabled={!!reorderBloque}>
      {liste}
    </ReorderProvider>
  );
}

function CarteDeLigne<T>({
  id,
  row,
  primaryColumn,
  badgeColumn,
  metaColumns,
  triable,
  reorderBloque,
  libelle,
  cochee,
  onBasculer,
  actions,
}: {
  id: string;
  row: T;
  primaryColumn: Column<T>;
  badgeColumn: Column<T> | null;
  metaColumns: Column<T>[];
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
    <li
      ref={triable ? setNodeRef : undefined}
      style={triable ? style : undefined}
      className={cn(
        "flex items-start gap-2 rounded-xl border border-border bg-card p-3",
        cochee && "border-primary/40 bg-primary/5",
        isDragging && "shadow-lg ring-1 ring-primary/40",
      )}
    >
      {triable ? (
        <ReorderHandle
          label={`Déplacer ${libelle}`}
          disabled={!!reorderBloque}
          disabledReason={reorderBloque}
          setActivatorNodeRef={setActivatorNodeRef}
          attributes={attributes}
          listeners={listeners}
          className="-ml-1.5"
        />
      ) : null}

      {cochee !== null ? (
        // La case garde 44 px de cible via son `<label>` : la primitive
        // shadcn ne fait que 16 px, ce qui est intouchable au doigt.
        <label className="flex size-11 shrink-0 cursor-pointer items-center justify-center">
          <Checkbox
            checked={cochee}
            onCheckedChange={onBasculer}
            aria-label={`Sélectionner ${libelle}`}
            className={CIBLE_44}
          />
        </label>
      ) : null}

      <div className="min-w-0 flex-1 py-1">
        <div className="flex items-start justify-between gap-2">
          <span className="min-w-0 text-sm font-medium text-foreground">
            {primaryColumn.cell(row)}
          </span>
          {badgeColumn ? (
            <span className="shrink-0">{badgeColumn.cell(row)}</span>
          ) : null}
        </div>

        {metaColumns.length > 0 ? (
          <dl className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1">
            {metaColumns.map((colonne) => (
              <div key={colonne.key} className="flex min-w-0 items-baseline gap-1.5">
                {/*
                  L'intitulé de colonne est conservé : hors du tableau, une
                  date nue ne dit pas si c'est une date de création ou de
                  dernière modification.
                */}
                <dt className="shrink-0 text-xs text-muted-foreground">
                  {colonne.header}
                </dt>
                <dd className="min-w-0 truncate text-xs font-medium text-foreground">
                  {colonne.cell(row)}
                </dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>

      {actions ? (
        <RowActionsMenu actions={actions} label={`Actions pour ${libelle}`} />
      ) : null}
    </li>
  );
}
