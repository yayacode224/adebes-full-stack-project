"use client";

import { ChevronDown, ChevronUp, SearchX } from "lucide-react";
import { useMemo, useState, useSyncExternalStore } from "react";
import { toast } from "sonner";

import { EmptyState } from "@/components/dashboard/feedback/empty-state";
import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { deplacer } from "@/components/dashboard/shared/reorder";
import { Button } from "@/components/ui/button";
import { useIsTableViewport } from "@/hooks/use-breakpoint";

import { BulkActionsBar } from "./bulk-bar";
import { CardView } from "./card-view";
import { DataTablePagination } from "./pagination";
import { DataTableSkeleton } from "./skeletons";
import { TableView } from "./table-view";
import { DataTableToolbar } from "./toolbar";
import type { Column, DataTableProps, EtatDeTri, RowAction } from "./types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE TABLEAU GÉNÉRIQUE DU DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §6.1 du Rapport 2. Les neuf collections du Lot 8 partagent cet écran ; il
 * n'y a pas neuf listes à écrire, ni neuf occasions d'oublier un état.
 *
 * ---------------------------------------------------------------------------
 * QUATRE ÉTATS, TOUS CONÇUS
 * ---------------------------------------------------------------------------
 *   1. **chargement** — squelettes dans les deux formes ;
 *   2. **erreur** — message + « Réessayer », jamais une liste vide ;
 *   3. **vide** — titre, explication, bouton d'action. Et deux vides
 *      distincts : « il n'y a rien » et « votre recherche ne donne rien »,
 *      qui n'appellent pas la même réaction ;
 *   4. **rempli**.
 *
 * ---------------------------------------------------------------------------
 * LE FILTRAGE, LE TRI ET LA PAGINATION SONT CÔTÉ CLIENT
 * ---------------------------------------------------------------------------
 * Assumé, et dimensionné : les collections de ce site comptent 8 programmes,
 * 3 articles, 7 questions fréquentes. Tout tient en mémoire. Une pagination
 * serveur imposerait un aller-retour par frappe dans la recherche, sur une
 * connexion mobile camerounaise — l'inverse de ce qu'on cherche.
 *
 * Le jour où une collection dépassera quelques centaines d'entrées, le
 * changement est borné à ce fichier : les props ne parlent que de `data`.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI UN VERROU DE MONTAGE AVANT DE CHOISIR TABLEAU OU CARTES
 * ---------------------------------------------------------------------------
 * `useIsTableViewport()` vaut `false` au rendu serveur (mobile d'abord). Sur
 * un écran large, rendre les cartes puis les remplacer par le tableau
 * produirait, à chaque chargement de liste, exactement le saut de mise en page
 * que le §6.1 cherche à éviter.
 *
 * Le squelette est donc affiché tant que le composant n'est pas monté. Lui
 * bascule en CSS et a déjà la bonne forme au premier pixel — la transition
 * visible est « squelette → contenu », celle qu'on attend d'un chargement, et
 * jamais « cartes → tableau ».
 */
export function DataTable<T>({
  data,
  columns,
  getRowId,
  primaryColumnKey,
  badgeColumnKey,
  isLoading = false,
  error,
  onRetry,
  emptyState,
  search,
  filters = [],
  pagination,
  selection,
  reorder,
  rowActions,
  itemLabel = "élément",
}: DataTableProps<T>) {
  const monte = useEstMonte();
  const enTableau = useIsTableViewport();

  const [recherche, setRecherche] = useState("");
  const [valeursDeFiltre, setValeursDeFiltre] = useState<Record<string, string>>({});
  const [tri, setTri] = useState<EtatDeTri>(null);
  const [page, setPage] = useState(1);
  const [selectionnes, setSelectionnes] = useState<Set<string>>(new Set());
  const [ordreLocal, setOrdreLocal] = useState<string[] | null>(null);

  const filtresActifs = Object.values(valeursDeFiltre).some(Boolean);
  const rechercheActive = recherche.trim().length > 0;

  /* ---------------------------------------------------------------------- */
  /* 1. Filtrage                                                             */
  /* ---------------------------------------------------------------------- */
  const filtrees = useMemo(() => {
    const terme = normaliser(recherche);

    return data.filter((row) => {
      if (search && terme) {
        const correspond = search.keys.some((cle) =>
          normaliser(String(row[cle] ?? "")).includes(terme),
        );
        if (!correspond) return false;
      }

      for (const filtre of filters) {
        const valeur = valeursDeFiltre[filtre.key];
        if (valeur && !filtre.match(row, valeur)) return false;
      }

      return true;
    });
  }, [data, filters, recherche, search, valeursDeFiltre]);

  /* ---------------------------------------------------------------------- */
  /* 2. Ordre                                                                */
  /* ---------------------------------------------------------------------- */

  /*
    Le réordonnancement n'a de sens que sur la liste ENTIÈRE, dans son ordre
    d'origine. Déplacer une ligne dans une vue triée ou filtrée écrirait des
    positions qui ne correspondent à rien : l'utilisateur verrait sa ligne
    « remonter » puis reprendre une place arbitraire au rechargement.

    Plutôt que de l'interdire silencieusement, les poignées restent visibles et
    désactivées, avec leur motif — l'utilisateur comprend quoi défaire.
  */
  const reorderBloque =
    reorder && (rechercheActive || filtresActifs || tri !== null)
      ? "réordonnancement impossible tant qu'un tri, un filtre ou une recherche est actif"
      : undefined;
  const reorderActif = !!reorder && !reorderBloque;

  const ordonnees = useMemo(() => {
    if (reorderActif && ordreLocal) {
      // Ordre optimiste appliqué en attendant que le serveur confirme.
      const parId = new Map(filtrees.map((row) => [getRowId(row), row]));
      const connues = ordreLocal
        .map((id) => parId.get(id))
        .filter((row): row is T => row !== undefined);
      const nouvelles = filtrees.filter((row) => !ordreLocal.includes(getRowId(row)));
      return [...connues, ...nouvelles];
    }

    if (!tri) return filtrees;

    const colonne = columns.find((c) => c.key === tri.key);
    if (!colonne) return filtrees;

    const signe = tri.sens === "asc" ? 1 : -1;

    return [...filtrees].sort((a, b) => {
      const va = valeurDeTri(colonne, a);
      const vb = valeurDeTri(colonne, b);

      // Les valeurs absentes finissent toujours en queue, quel que soit le
      // sens : une ligne sans date n'est ni « la plus ancienne » ni « la plus
      // récente », elle est indéterminée.
      if (va === null && vb === null) return 0;
      if (va === null) return 1;
      if (vb === null) return -1;

      if (typeof va === "number" && typeof vb === "number") {
        return (va - vb) * signe;
      }

      // Comparaison française : « é » se classe avec « e », pas après « z ».
      return String(va).localeCompare(String(vb), "fr", { numeric: true }) * signe;
    });
  }, [columns, filtrees, getRowId, ordreLocal, reorderActif, tri]);

  /* ---------------------------------------------------------------------- */
  /* 3. Pagination                                                           */
  /* ---------------------------------------------------------------------- */

  /*
    La pagination reste active même quand le réordonnancement l'est.

    Une première version les rendait exclusifs — le glisser-déposer portait sur
    la liste entière, donc plus de pages. C'était trop cher : une collection de
    deux cents entrées se serait rendue d'un bloc dès que l'écran autorise le
    réordonnancement.

    La bonne réponse est de RECOMPOSER : le glissement ne réordonne que la
    tranche visible, et `reordonnerTranche` la réinsère à sa position dans la
    liste complète. L'ordre global reste juste. Seul le déplacement d'une page
    à l'autre échappe au glisser-déposer — « Monter » et « Descendre », qui
    travaillent sur la liste entière, le font franchir la limite de page.
  */
  const paginationActive = !!pagination;
  const taille = pagination?.pageSize ?? ordonnees.length;
  const pages = paginationActive ? Math.max(1, Math.ceil(ordonnees.length / taille)) : 1;
  const pageCourante = Math.min(page, pages);
  const decalage = paginationActive ? (pageCourante - 1) * taille : 0;

  const affichees = paginationActive
    ? ordonnees.slice(decalage, decalage + taille)
    : ordonnees;

  /* ---------------------------------------------------------------------- */
  /* 4. Colonnes de la vue en cartes                                         */
  /* ---------------------------------------------------------------------- */
  const colonnePrimaire =
    columns.find((c) => c.key === primaryColumnKey) ?? columns[0]!;
  const colonneBadge =
    columns.find(
      (c) => c.key === (badgeColumnKey ?? "status") && c.key !== colonnePrimaire.key,
    ) ?? null;
  const colonnesMeta = columns
    .filter(
      (c) =>
        c.key !== colonnePrimaire.key &&
        c.key !== colonneBadge?.key &&
        !c.hideOnMobile,
    )
    .slice(0, 2);

  /* ---------------------------------------------------------------------- */
  /* 5. Actions                                                              */
  /* ---------------------------------------------------------------------- */

  /** Tous les identifiants, dans l'ordre global — page courante comprise. */
  const idsOrdonnes = ordonnees.map(getRowId);
  /** Ceux de la page affichée : c'est sur eux que porte le glissement. */
  const idsAffiches = affichees.map(getRowId);

  /**
   * Réinsère la tranche réordonnée dans la liste complète.
   *
   * Sans cette recomposition, un glissement en page 2 enverrait au serveur les
   * cinq identifiants de la page comme s'ils étaient toute la collection — et
   * les sept autres se retrouveraient à des positions arbitraires.
   */
  function reordonnerTranche(ordreVisible: string[]) {
    const complet = [...idsOrdonnes];
    complet.splice(decalage, ordreVisible.length, ...ordreVisible);
    void appliquerOrdre(complet);
  }

  async function appliquerOrdre(ordre: string[]) {
    if (!reorder) return;
    setOrdreLocal(ordre);
    try {
      await reorder.onReorder(ordre);
    } catch {
      // Retour à l'ordre du serveur, et on le DIT : une liste qui se remet
      // toute seule en place sans explication passe pour un bug.
      setOrdreLocal(null);
      toast.error("Le nouvel ordre n'a pas pu être enregistré.");
    }
  }

  /**
   * Les actions d'une ligne, augmentées de « Monter » / « Descendre ».
   *
   * ⚠️  L'ALTERNATIVE SANS GLISSER-DÉPOSER EST OBLIGATOIRE (§12) : c'est le
   * seul moyen fiable sur un petit écran, et le seul praticable aux
   * technologies d'assistance. Elle est ajoutée ici plutôt que laissée à la
   * charge de chaque écran — un écran sur neuf finirait par l'oublier.
   */
  const avecActions = !!rowActions || !!reorder;

  function actionsDeLigne(row: T): RowAction[] {
    const propres = rowActions?.(row) ?? [];
    if (!reorder) return propres;

    const id = getRowId(row);
    const index = idsOrdonnes.indexOf(id);

    return [
      ...propres,
      {
        label: "Monter",
        icon: ChevronUp,
        disabled: !reorderActif || index <= 0,
        disabledReason: reorderBloque ?? "déjà en première position",
        onSelect: () => {
          const suivant = deplacer(idsOrdonnes, id, "haut");
          if (suivant) void appliquerOrdre(suivant);
        },
      },
      {
        label: "Descendre",
        icon: ChevronDown,
        disabled: !reorderActif || index === idsOrdonnes.length - 1,
        disabledReason: reorderBloque ?? "déjà en dernière position",
        onSelect: () => {
          const suivant = deplacer(idsOrdonnes, id, "bas");
          if (suivant) void appliquerOrdre(suivant);
        },
      },
    ];
  }

  function basculerTri(cle: string) {
    setPage(1);
    setTri((precedent) => {
      if (precedent?.key !== cle) return { key: cle, sens: "asc" };
      // Troisième clic : retour à l'ordre d'origine. Sans lui, on ne peut plus
      // revenir à l'ordre éditorial une fois qu'on a trié.
      if (precedent.sens === "asc") return { key: cle, sens: "desc" };
      return null;
    });
  }

  function effacerFiltres() {
    setValeursDeFiltre({});
    setRecherche("");
    setPage(1);
  }

  /* ---------------------------------------------------------------------- */
  /* 6. États                                                                */
  /* ---------------------------------------------------------------------- */

  if (error) {
    return <ErrorState message={error} onRetry={onRetry} />;
  }

  if (isLoading || !monte) {
    return <DataTableSkeleton colonnes={Math.min(columns.length, 5)} />;
  }

  if (data.length === 0) {
    return (
      <EmptyState
        title={emptyState.title}
        description={emptyState.description}
        action={emptyState.action}
      />
    );
  }

  const barreDOutils = (
    <DataTableToolbar
      recherche={recherche}
      onRecherche={(valeur) => {
        setRecherche(valeur);
        setPage(1);
      }}
      placeholder={search?.placeholder}
      filtres={filters}
      valeursDeFiltre={valeursDeFiltre}
      onFiltre={(cle, valeur) => {
        setValeursDeFiltre((precedent) => ({ ...precedent, [cle]: valeur }));
        setPage(1);
      }}
      onEffacerFiltres={effacerFiltres}
    />
  );

  /* Recherche ou filtre sans résultat — un vide qui n'est pas le même. */
  if (ordonnees.length === 0) {
    return (
      <div className="flex flex-col gap-4">
        {barreDOutils}
        <EmptyState
          icon={SearchX}
          title="Aucun résultat"
          description="Aucun élément ne correspond à votre recherche ou à vos filtres."
          action={
            <Button type="button" variant="outline" onClick={effacerFiltres}>
              Effacer la recherche et les filtres
            </Button>
          }
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      {barreDOutils}

      {selection ? (
        <BulkActionsBar
          count={selectionnes.size}
          actions={selection.actions}
          onAction={(action) => selection.onBulk([...selectionnes], action)}
          onClear={() => setSelectionnes(new Set())}
        />
      ) : null}

      {reorderBloque ? (
        <p className="rounded-lg border border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
          L&apos;ordre ne peut pas être modifié tant qu&apos;un tri, un filtre
          ou une recherche est actif.{" "}
          <button
            type="button"
            onClick={() => {
              effacerFiltres();
              setTri(null);
            }}
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste complète
          </button>
        </p>
      ) : null}

      {enTableau ? (
        <TableView
          rows={affichees}
          columns={columns}
          getRowId={getRowId}
          tri={tri}
          onTri={basculerTri}
          selection={selection ? selectionnes : null}
          onSelection={setSelectionnes}
          rowActions={avecActions ? actionsDeLigne : undefined}
          reorderIds={reorder ? idsAffiches : null}
          onReorder={reordonnerTranche}
          reorderBloque={reorderBloque}
          libelleDeLigne={(row) => libelleDeLigne(colonnePrimaire, row)}
        />
      ) : (
        <CardView
          rows={affichees}
          getRowId={getRowId}
          primaryColumn={colonnePrimaire}
          badgeColumn={colonneBadge}
          metaColumns={colonnesMeta}
          selection={selection ? selectionnes : null}
          onSelection={setSelectionnes}
          rowActions={avecActions ? actionsDeLigne : undefined}
          reorderIds={reorder ? idsAffiches : null}
          onReorder={reordonnerTranche}
          reorderBloque={reorderBloque}
          libelleDeLigne={(row) => libelleDeLigne(colonnePrimaire, row)}
        />
      )}

      <DataTablePagination
        page={pageCourante}
        pages={pages}
        total={ordonnees.length}
        debut={paginationActive ? (pageCourante - 1) * taille + 1 : 1}
        fin={
          paginationActive
            ? Math.min(pageCourante * taille, ordonnees.length)
            : ordonnees.length
        }
        itemLabel={itemLabel}
        onPage={setPage}
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Utilitaires
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Le composant est-il monté côté client ?
 *
 * `useSyncExternalStore` plutôt qu'un `useState` + `useEffect` : même résultat,
 * un rendu de moins, et surtout aucun effet à nettoyer. L'abonnement est un
 * `noop` — la valeur ne change qu'une fois, du serveur au client.
 */
function useEstMonte(): boolean {
  return useSyncExternalStore(
    () => () => undefined,
    () => true,
    () => false,
  );
}

/**
 * Valeur comparable d'une cellule.
 *
 * `cell` renvoie du JSX, qui ne se compare pas. `sortValue` est donc la
 * source de vérité ; le repli sur `row[key]` ne vaut que pour une colonne dont
 * la clé est aussi une propriété textuelle de la ligne.
 */
function valeurDeTri<T>(colonne: Column<T>, row: T): string | number | null {
  const brut = colonne.sortValue
    ? colonne.sortValue(row)
    : (row as Record<string, unknown>)[colonne.key];

  if (brut === null || brut === undefined || brut === "") return null;
  if (brut instanceof Date) return brut.getTime();
  if (typeof brut === "number" || typeof brut === "string") return brut;
  return String(brut);
}

/**
 * Nom lisible d'une ligne, pour les libellés d'accessibilité.
 *
 * `cell` peut renvoyer n'importe quel JSX : on ne cherche à en tirer un texte
 * que lorsqu'il est déjà une chaîne ou un nombre. Le repli « cet élément »
 * reste préférable à un `aria-label` vide ou à un `[object Object]`.
 */
function libelleDeLigne<T>(colonne: Column<T>, row: T): string {
  const rendu = colonne.sortValue?.(row) ?? colonne.cell(row);
  if (typeof rendu === "string" || typeof rendu === "number") return String(rendu);

  const brut = (row as Record<string, unknown>)[colonne.key];
  if (typeof brut === "string" || typeof brut === "number") return String(brut);

  return "cet élément";
}

/** Comparaison insensible à la casse et aux accents. */
function normaliser(texte: string): string {
  return texte
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .trim();
}
