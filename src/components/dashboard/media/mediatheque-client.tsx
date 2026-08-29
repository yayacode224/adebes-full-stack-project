"use client";

import { LayoutGrid, List, Pencil, Search, Upload } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";

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
  MEDIA_KIND_LABELS,
  MEDIA_KINDS,
  type MediaAsset,
  type MediaKind,
} from "@/core/cms/entities/media-asset";
import type { Page } from "@/core/shared/pagination";
import { formaterPoids } from "@/lib/media-url";
import { cn } from "@/lib/utils";
import { listerMediasAction } from "@/server/actions/media.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { EmptyState } from "../feedback/empty-state";
import { CHAMP, CHAMP_SELECT } from "../forms/field-styles";
import { PageHeader } from "../layout/page-header";
import { FormModal } from "../modals/form-modal";
import { MediaDetail, formaterDateMedia, typeMediaLisible } from "./media-detail";
import { MediaGrid } from "./media-grid";
import { MediaThumbnail } from "./media-thumbnail";
import { MediaUploader } from "./media-uploader";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/mediatheque`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §7.1 du Rapport 2 : grille de vignettes, filtres par type et par dossier,
 * recherche sur `filename`, `alt_text` et `caption`, panneau latéral de détail.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI LE FILTRAGE EST ICI CÔTÉ SERVEUR, ALORS QUE `<DataTable>` LE FAIT
 * CÔTÉ CLIENT
 * ---------------------------------------------------------------------------
 * Ce n'est pas une incohérence, c'est la même règle appliquée à des volumes
 * différents. `<DataTable>` filtre en mémoire parce que les collections de ce
 * site comptent huit programmes ou trois articles — tout tient dans la page.
 * La médiathèque, elle, grossit sans limite : chaque action de terrain y ajoute
 * une série de photos. Charger tout le catalogue pour filtrer trois mots serait
 * exactement l'inverse de ce qu'on cherche sur une connexion mobile.
 *
 * Conséquence assumée : `<DataTable>` reçoit ici la page DÉJÀ filtrée, sans ses
 * props `search`, `filters` ni `pagination`. Ce qu'on lui emprunte — et qui
 * justifie de le réutiliser plutôt que d'écrire une seconde liste — ce sont ses
 * quatre états et sa bascule cartes/tableau à 768 px, déjà recettés au Lot 6.
 * Les contrôles de filtre sont uniques et au-dessus des DEUX vues : un
 * utilisateur qui bascule grille ↔ liste garde sa recherche.
 */

/** Fichiers par page. Assez pour remplir un grand écran, pas au-delà. */
const TAILLE_PAGE = 48;

/** Délai avant d'interroger le serveur pendant la frappe. */
const DELAI_RECHERCHE = 300;

/**
 * Valeur de la liste déroulante désignant « aucun dossier ».
 *
 * Radix interdit la chaîne vide comme valeur d'un `SelectItem` — elle est
 * réservée à « rien de choisi ». Le filtre du dépôt, lui, distingue
 * `undefined` (tous les dossiers) de `""` (la racine) : la traduction est
 * faite au moment de l'appel.
 */
const RACINE = "racine";

type Vue = "grille" | "liste";

export function MediathequeClient({
  pageInitiale,
  dossiers,
  actorId,
  peutTeleverser,
  peutModifier,
  peutSupprimer,
}: {
  pageInitiale: Page<MediaAsset>;
  dossiers: readonly string[];
  actorId: string | null;
  peutTeleverser: boolean;
  peutModifier: boolean;
  peutSupprimer: boolean;
}) {
  const [page, setPage] = useState(pageInitiale);
  const [numero, setNumero] = useState(1);
  const [recherche, setRecherche] = useState("");
  const [kind, setKind] = useState<MediaKind | "tous">("tous");
  const [dossier, setDossier] = useState<string>("tous");
  const [vue, setVue] = useState<Vue>("grille");
  const [selection, setSelection] = useState<MediaAsset | null>(null);
  const [televersementOuvert, setTeleversementOuvert] = useState(false);
  const [chargement, setChargement] = useState(false);
  const [erreur, setErreur] = useState<string | null>(null);

  /*
    Le premier rendu affiche la page venue du serveur : la relancer aussitôt
    doublerait la requête et ferait clignoter la grille au chargement.
  */
  const premierRendu = useRef(true);

  const filtresActifs =
    recherche.trim().length > 0 || kind !== "tous" || dossier !== "tous";

  const charger = useCallback(
    async (options: { page: number }) => {
      setChargement(true);
      setErreur(null);

      const resultat = await listerMediasAction({
        search: recherche.trim() || undefined,
        kind: kind === "tous" ? undefined : kind,
        // `RACINE` est l'étiquette de la liste déroulante ; le filtre attend
        // la chaîne vide, qui signifie « aucun dossier » côté dépôt. Radix
        // interdit la valeur vide pour un `SelectItem`, d'où la traduction.
        folder:
          dossier === "tous" ? undefined : dossier === RACINE ? "" : dossier,
        page: options.page,
        pageSize: TAILLE_PAGE,
      });

      setChargement(false);

      if (!resultat.ok) {
        setErreur(resultat.message);
        return;
      }

      setPage(resultat.data);
    },
    [dossier, kind, recherche],
  );

  /*
    Un seul effet pour les trois filtres : ils déclenchent tous la même
    requête, et les séparer produirait deux appels quand deux d'entre eux
    changent ensemble. Le délai n'existe que pour la recherche, mais l'appliquer
    aussi aux listes déroulantes ne coûte rien de perceptible.
  */
  useEffect(() => {
    if (premierRendu.current) {
      premierRendu.current = false;
      return;
    }

    const minuterie = setTimeout(() => {
      setNumero(1);
      void charger({ page: 1 });
    }, DELAI_RECHERCHE);

    return () => clearTimeout(minuterie);
  }, [charger]);

  function allerA(numeroDemande: number) {
    setNumero(numeroDemande);
    void charger({ page: numeroDemande });
  }

  /** Après un téléversement : on revient en tête de liste pour voir le résultat. */
  function apresTeleversement(crees: MediaAsset[]) {
    setTeleversementOuvert(false);
    toast.success(
      crees.length === 1
        ? "Fichier ajouté à la médiathèque."
        : `${crees.length} fichiers ajoutés à la médiathèque.`,
    );
    setNumero(1);
    void charger({ page: 1 });
  }

  const colonnes: Column<MediaAsset>[] = [
    {
      key: "apercu",
      header: "Aperçu",
      width: "4.5rem",
      cell: (media) => (
        <span className="block w-14 overflow-hidden rounded-md">
          <MediaThumbnail asset={media} sizes="56px" />
        </span>
      ),
    },
    {
      key: "filename",
      header: "Nom du fichier",
      cell: (media) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">
            {media.filename}
          </span>
          <span className="truncate text-xs text-muted-foreground">
            {media.altText}
          </span>
        </span>
      ),
      sortable: true,
      sortValue: (media) => media.filename,
    },
    {
      key: "type",
      header: "Type",
      cell: (media) => typeMediaLisible(media.mimeType),
      sortable: true,
      sortValue: (media) => media.mimeType,
      hideOnMobile: true,
    },
    {
      key: "poids",
      header: "Poids",
      align: "end",
      cell: (media) => formaterPoids(media.sizeBytes),
      sortable: true,
      // Le poids formaté (« 1,2 Mo ») se trierait comme du texte : « 1,2 Mo »
      // avant « 900 Ko ». La valeur brute est donc déclarée à part.
      sortValue: (media) => media.sizeBytes,
    },
    {
      key: "dossier",
      header: "Dossier",
      cell: (media) => media.folder ?? "—",
      hideOnMobile: true,
    },
    {
      key: "createdAt",
      header: "Ajouté le",
      align: "end",
      cell: (media) => formaterDateMedia(media.createdAt) ?? "—",
      sortable: true,
      sortValue: (media) => new Date(media.createdAt),
    },
  ];

  const etatVide = filtresActifs
    ? {
        title: "Aucun fichier ne correspond",
        description:
          "Modifiez la recherche ou retirez un filtre pour élargir le résultat.",
        action: (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setRecherche("");
              setKind("tous");
              setDossier("tous");
            }}
          >
            Réinitialiser les filtres
          </Button>
        ),
      }
    : {
        title: "La médiathèque est vide",
        description:
          "Téléversez vos premières photos ou vos documents pour pouvoir les utiliser dans les pages et les programmes.",
        action: peutTeleverser ? (
          <Button type="button" onClick={() => setTeleversementOuvert(true)}>
            <Upload className="size-4" aria-hidden="true" />
            Téléverser des fichiers
          </Button>
        ) : undefined,
      };

  return (
    <div className="flex flex-col gap-6">
      {/*
        `<PageHeader>` est rendu ICI et non dans la page.

        Il est resté Server Component au Lot 6 (écart nº 42) précisément pour
        pouvoir accueillir des boutons liés à des Server Actions ; il n'a
        aucune dépendance serveur, il traverse donc sans peine la frontière
        cliente. L'action primaire de cet écran ouvre une modale, c'est-à-dire
        un état client : la placer dans la page obligerait à faire remonter cet
        état par un contexte, pour le seul plaisir d'un `<PageHeader>` rendu
        côté serveur.
      */}
      <PageHeader
        title="Médiathèque"
        description="Les photos et les documents utilisables dans les pages, les programmes et les actualités."
        actions={
          peutTeleverser ? (
            <Button type="button" onClick={() => setTeleversementOuvert(true)}>
              <Upload className="size-4" aria-hidden="true" />
              Téléverser des fichiers
            </Button>
          ) : undefined
        }
      />

      {/* ---------------------------------------------------------------- */}
      {/* Barre d'outils — commune aux deux vues                            */}
      {/* ---------------------------------------------------------------- */}
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
        <div className="relative min-w-0 flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            type="search"
            value={recherche}
            onChange={(evenement) => setRecherche(evenement.target.value)}
            placeholder="Rechercher un fichier, une description…"
            aria-label="Rechercher dans la médiathèque"
            className={cn(CHAMP, "pl-9")}
          />
        </div>

        <div className="flex flex-col gap-3 sm:flex-row">
          <Select
            value={kind}
            onValueChange={(valeur) =>
              setKind(valeur === "tous" ? "tous" : (valeur as MediaKind))
            }
          >
            <SelectTrigger
              aria-label="Filtrer par type de fichier"
              className={cn(CHAMP_SELECT, "sm:w-44")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les types</SelectItem>
              {MEDIA_KINDS.map((valeur) => (
                <SelectItem key={valeur} value={valeur}>
                  {MEDIA_KIND_LABELS[valeur]}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={dossier} onValueChange={setDossier}>
            <SelectTrigger
              aria-label="Filtrer par dossier"
              className={cn(CHAMP_SELECT, "sm:w-44")}
            >
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="tous">Tous les dossiers</SelectItem>
              <SelectItem value={RACINE}>Sans dossier</SelectItem>
              {dossiers.map((nom) => (
                <SelectItem key={nom} value={nom}>
                  {nom}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/*
            Bascule grille / liste. Deux boutons plutôt qu'un interrupteur :
            l'état courant se lit sans avoir à interpréter une icône, et
            `aria-pressed` l'annonce aux lecteurs d'écran.
          */}
          <div
            role="group"
            aria-label="Affichage de la médiathèque"
            className="flex shrink-0 gap-1 rounded-lg border border-border p-1"
          >
            <Button
              type="button"
              variant={vue === "grille" ? "secondary" : "ghost"}
              size="icon"
              aria-pressed={vue === "grille"}
              aria-label="Affichage en grille"
              onClick={() => setVue("grille")}
            >
              <LayoutGrid className="size-4" aria-hidden="true" />
            </Button>
            <Button
              type="button"
              variant={vue === "liste" ? "secondary" : "ghost"}
              size="icon"
              aria-pressed={vue === "liste"}
              aria-label="Affichage en liste"
              onClick={() => setVue("liste")}
            >
              <List className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Contenu + panneau de détail                                       */}
      {/* ---------------------------------------------------------------- */}
      <div
        className={cn(
          "grid items-start gap-6",
          selection && "lg:grid-cols-[minmax(0,1fr)_22rem]",
        )}
      >
        <div className="min-w-0">
          {vue === "liste" ? (
            <DataTable<MediaAsset>
              data={page.items}
              columns={colonnes}
              getRowId={(media) => media.id}
              primaryColumnKey="filename"
              isLoading={chargement}
              error={erreur ?? undefined}
              onRetry={() => void charger({ page: numero })}
              emptyState={etatVide}
              itemLabel="fichier"
              rowActions={(media) => [
                {
                  label: "Ouvrir la fiche",
                  icon: Pencil,
                  onSelect: () => setSelection(media),
                },
              ]}
            />
          ) : chargement ? (
            <GrilleSquelette />
          ) : erreur ? (
            <div
              role="alert"
              className="rounded-xl border border-destructive/40 bg-destructive/5 px-4 py-6 text-center"
            >
              <p className="text-sm font-medium text-destructive">{erreur}</p>
              <Button
                type="button"
                variant="outline"
                className="mt-3"
                onClick={() => void charger({ page: numero })}
              >
                Réessayer
              </Button>
            </div>
          ) : page.items.length === 0 ? (
            <EmptyState {...etatVide} />
          ) : (
            <MediaGrid
              medias={page.items}
              onOuvrir={setSelection}
              selection={selection ? new Set([selection.id]) : undefined}
            />
          )}

          {/* Pagination serveur — visible dans les deux vues. */}
          {page.pageCount > 1 ? (
            <nav
              aria-label="Pages de la médiathèque"
              className="mt-4 flex flex-col items-center gap-3 sm:flex-row sm:justify-between"
            >
              <p aria-live="polite" className="text-sm text-muted-foreground">
                Page {page.page} sur {page.pageCount} — {page.total} fichier
                {page.total > 1 ? "s" : ""}
              </p>

              <div className="flex w-full gap-2 sm:w-auto [&>*]:flex-1 sm:[&>*]:flex-none">
                <Button
                  type="button"
                  variant="outline"
                  disabled={page.page <= 1 || chargement}
                  onClick={() => allerA(page.page - 1)}
                >
                  Page précédente
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  disabled={page.page >= page.pageCount || chargement}
                  onClick={() => allerA(page.page + 1)}
                >
                  Page suivante
                </Button>
              </div>
            </nav>
          ) : null}
        </div>

        {selection ? (
          <MediaDetail
            media={selection}
            actorId={actorId}
            peutModifier={peutModifier}
            peutSupprimer={peutSupprimer}
            onFermer={() => setSelection(null)}
            onModifie={(media) => {
              setSelection(media);
              setPage((actuelle) => ({
                ...actuelle,
                items: actuelle.items.map((element) =>
                  element.id === media.id ? media : element,
                ),
              }));
              toast.success("Fiche mise à jour.");
            }}
            onSupprime={() => {
              setSelection(null);
              toast.success("Fichier supprimé.");
              // Rechargement plutôt que retrait local : la page courante doit
              // se recompléter depuis le serveur, sinon elle rétrécit à chaque
              // suppression jusqu'à paraître vide.
              void charger({ page: numero });
            }}
          />
        ) : null}
      </div>

      {/* ---------------------------------------------------------------- */}
      {/* Téléversement                                                     */}
      {/* ---------------------------------------------------------------- */}
      {peutTeleverser ? (
        <FormModal
          open={televersementOuvert}
          onOpenChange={setTeleversementOuvert}
          title="Téléverser des fichiers"
          description="Chaque fichier doit être décrit avant d'être enregistré."
        >
          <MediaUploader onTermine={apresTeleversement} />
        </FormModal>
      ) : null}

    </div>
  );
}

/** Squelette de la grille — même forme que le contenu, pas un bloc gris. */
function GrilleSquelette() {
  return (
    <ul
      aria-hidden="true"
      className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6"
    >
      {Array.from({ length: 12 }, (_, index) => (
        <li
          key={index}
          className="overflow-hidden rounded-xl border border-border bg-card"
        >
          <div className="aspect-square w-full animate-pulse bg-muted" />
          <div className="space-y-1.5 px-2.5 py-2">
            <div className="h-3.5 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-3 w-1/2 animate-pulse rounded bg-muted" />
          </div>
        </li>
      ))}
    </ul>
  );
}
