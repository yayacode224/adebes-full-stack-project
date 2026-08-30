"use client";

import {
  ArrowUpFromLine,
  Copy,
  FolderOpen,
  ImageOff,
  Pencil,
  Plus,
  Trash2,
  TriangleAlert,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "@/core/cms/entities/content-status";
import {
  CATEGORIE_ABSENTE,
  categoriesAffichees,
  type GalleryCategory,
  type GalleryItem,
} from "@/core/cms/entities/gallery";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import {
  changerStatutElementGalerieAction,
  reordonnerElementsGalerieAction,
  supprimerElementGalerieAction,
} from "@/server/actions/gallery.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { MediaThumbnail } from "../media/media-thumbnail";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { GalleryCategoriesModal } from "./gallery-categories-modal";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/galerie`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8H du Rapport 2, transposition du gabarit du §8A.3 : glissière de
 * réordonnancement · Photo · Description · Catégorie · État · Actions.
 * Filtres : état, catégorie. Actions groupées : publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA RECHERCHE PORTE SUR UN TEXTE QUI N'EST PAS DANS LA TABLE
 * ---------------------------------------------------------------------------
 * `gallery_items` n'a AUCUNE colonne de texte (migration 0005). La description
 * d'une photo vit dans `media_assets.alt_text`, et le dépôt ignore donc
 * `filter.search` — voir l'en-tête de `gallery-item.repository.ts`.
 *
 * La recherche existe malgré tout ici, et elle est juste : la page enrichit
 * chaque ligne du texte alternatif et du nom de fichier de son média AVANT de
 * la passer au `<DataTable>`, qui filtre en mémoire (écart nº 51). C'est le
 * seul endroit de la chaîne où les deux informations sont réunies.
 *
 * C'est aussi pourquoi ce fichier travaille sur `LigneGalerie` et non sur
 * `GalleryItem` : le type dit explicitement que ces trois champs viennent
 * d'ailleurs et n'appartiennent pas à l'entité.
 *
 * ---------------------------------------------------------------------------
 * DEUX CHOSES QUE CET ÉCRAN DIT ET QU'AUCUN AUTRE N'AVAIT À DIRE
 * ---------------------------------------------------------------------------
 *
 * **1. Quelles photos aucun filtre n'atteint.** Une photo sans catégorie est
 * publiée, visible, et n'apparaît que dans « Tous ». C'est l'équivalent, pour
 * cette collection, de la question générale hors des quatre premières de
 * l'accueil (Lot 8F) : un état légitime, invisible, qu'il faut SIGNALER plutôt
 * que laisser découvrir.
 *
 * **2. Les photos en double.** Rien n'interdit d'ajouter deux fois le même
 * fichier — ni la base, ni le métier — mais la grille l'afficherait deux fois,
 * ce qui ressemble à un défaut d'affichage. Signalé sur LES DEUX lignes, jamais
 * interdit : doctrine de l'écart nº 115, et la seconde ligne n'est pas plus
 * fautive que la première.
 */

/**
 * Une ligne de l'écran : l'élément, plus ce que son média apporte.
 *
 * ⚠️  Les trois champs ajoutés ne sont PAS des champs de l'entité. Ils sont
 * calculés par la page à partir des médias résolus, et ils existent pour deux
 * raisons précises : rendre la recherche possible (`search.keys` porte sur les
 * clés de la ligne) et rendre le tri possible (`sortValue` a besoin d'une
 * valeur comparable).
 */
type LigneGalerie = GalleryItem & {
  /** Le texte alternatif du média, ou une chaîne vide s'il est introuvable. */
  description: string;
  /** Le nom d'origine du fichier — second angle de recherche. */
  nomFichier: string;
  /** Le libellé de la catégorie, ou « Sans catégorie ». */
  categorie: string;
};

export function GalleryClient({
  elements,
  medias,
  categories,
  total,
  peutCreer,
  peutModifier,
  peutPublier,
  peutSupprimer,
  peutReordonner,
}: {
  elements: GalleryItem[];
  /** Photos déjà résolues côté serveur, indexées par identifiant de média. */
  medias: Record<string, MediaAsset>;
  categories: GalleryCategory[];
  /** Nombre total d'éléments en base — voir la note sur la borne, plus bas. */
  total: number;
  peutCreer: boolean;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<LigneGalerie | null>(null);
  const [aSupprimerEnLot, setASupprimerEnLot] = useState<string[] | null>(null);
  const [categoriesOuvertes, setCategoriesOuvertes] = useState(false);

  const parId = new Map(categories.map((categorie) => [categorie.id, categorie]));

  const lignes: LigneGalerie[] = elements.map((element) => {
    const media = medias[element.mediaId];
    const categorie = element.categoryId ? parId.get(element.categoryId) : undefined;

    return {
      ...element,
      description: media?.altText ?? "",
      nomFichier: media?.filename ?? "",
      categorie: categorie?.label ?? CATEGORIE_ABSENTE,
    };
  });

  /*
    Ce que le SITE montre, calculé une fois pour l'écran entier.

    `categoriesAffichees` est la fonction du domaine, celle-là même qu'appelle
    la page publique : recopier la règle ici l'aurait fait diverger le jour où
    la page change d'avis sur les catégories vides.
  */
  const publies = elements.filter((element) => element.status === "published");
  const filtresRendus = categoriesAffichees(publies, categories);

  const publiesSansCategorie = publies.filter(
    (element) => element.categoryId === null,
  ).length;

  const categoriesVides = categories.filter(
    (categorie) => !filtresRendus.some((rendue) => rendue.id === categorie.id),
  );

  /** Combien de photos chaque catégorie classe — brouillons compris. */
  const comptesParCategorie: Record<string, number> = {};
  for (const categorie of categories) comptesParCategorie[categorie.id] = 0;
  for (const element of elements) {
    if (element.categoryId && element.categoryId in comptesParCategorie) {
      comptesParCategorie[element.categoryId] += 1;
    }
  }

  /** Les médias employés plus d'une fois, quel que soit le statut. */
  const doublons = new Set<string>();
  const vus = new Set<string>();
  for (const element of elements) {
    if (vus.has(element.mediaId)) doublons.add(element.mediaId);
    else vus.add(element.mediaId);
  }

  /** Les éléments dont la photo n'a pas pu être résolue. */
  const sansMedia = lignes.filter((ligne) => !medias[ligne.mediaId]).length;

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function changerStatut(ligne: LigneGalerie, status: ContentStatus) {
    const resultat = await changerStatutElementGalerieAction({
      id: ligne.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? "La photo est en ligne."
        : "La photo n'est plus visible sur le site.",
    );
    router.refresh();
  }

  async function supprimer(ligne: LigneGalerie) {
    const resultat = await supprimerElementGalerieAction({ id: ligne.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      "La photo a été retirée de la galerie. Le fichier reste dans la médiathèque.",
    );
    router.refresh();
  }

  /**
   * Actions groupées.
   *
   * Séquentielles et non parallèles : chaque suppression renumérote les
   * positions restantes (voir `deleteGalleryItem`), et deux renumérotations
   * concurrentes produiraient un ordre que personne n'a voulu.
   */
  async function appliquerEnLot(
    ids: string[],
    traiter: (ligne: LigneGalerie) => Promise<boolean>,
    resume: (reussites: number, echecs: number) => string,
  ) {
    let reussites = 0;
    let echecs = 0;

    for (const id of ids) {
      const ligne = lignes.find((candidate) => candidate.id === id);
      if (!ligne) continue;
      if (await traiter(ligne)) reussites += 1;
      else echecs += 1;
    }

    if (echecs === 0) toast.success(resume(reussites, echecs));
    else toast.error(resume(reussites, echecs), { duration: 10000 });

    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Colonnes                                                                */
  /* ---------------------------------------------------------------------- */

  const colonnes: Column<LigneGalerie>[] = [
    {
      key: "photo",
      header: "Photo",
      width: "5rem",
      cell: (ligne) => {
        const media = medias[ligne.mediaId];

        return (
          <span className="block w-14 overflow-hidden rounded-md">
            {media ? (
              <MediaThumbnail asset={media} sizes="56px" />
            ) : (
              /*
                La référence pointe sur un média que la lecture n'a pas rendu.
                On le DIT plutôt que de laisser une case vide, qu'on prendrait
                pour un défaut de chargement — invariant nº 2.

                ⚠️  L'état est très improbable : `media_id` est `not null` avec
                `on delete restrict`. Il reste atteignable par une lecture
                partielle, et c'est précisément le genre de cas qu'on ne veut
                pas voir se traduire par un carré gris muet.
              */
              <span
                title="La photo associée n'a pas pu être chargée"
                className="flex aspect-square w-full items-center justify-center rounded-md bg-muted text-muted-foreground"
              >
                <ImageOff className="size-4" aria-hidden="true" />
                <span className="sr-only">Photo introuvable</span>
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "description",
      header: "Description",
      sortable: true,
      sortValue: (ligne) => ligne.description,
      cell: (ligne) => {
        const enDouble = doublons.has(ligne.mediaId);

        return (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="line-clamp-2 font-medium text-foreground">
              {ligne.description || (
                // Invariant nº 1 : une absence est DITE, jamais une case vide.
                <span className="text-muted-foreground">
                  Description indisponible
                </span>
              )}
            </span>

            {ligne.nomFichier ? (
              <span className="truncate text-xs text-muted-foreground">
                {ligne.nomFichier}
              </span>
            ) : null}

            {/*
              Le motif est écrit en toutes lettres, pas seulement porté par une
              icône : une information rendue par la seule couleur ou la seule
              forme est invisible pour un lecteur d'écran.
            */}
            {enDouble ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
                <Copy className="size-3.5 shrink-0" aria-hidden="true" />
                Cette photo est déjà dans la galerie
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "categorie",
      header: "Catégorie",
      sortable: true,
      sortValue: (ligne) => ligne.categorie,
      cell: (ligne) =>
        ligne.categoryId ? (
          <span className="text-muted-foreground">{ligne.categorie}</span>
        ) : (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="text-muted-foreground">{CATEGORIE_ABSENTE}</span>
            <span className="text-xs text-muted-foreground">
              n&apos;apparaît que dans « Tous »
            </span>
          </span>
        ),
    },
    {
      key: "status",
      header: "État",
      sortable: true,
      // Trier sur le RANG du cycle éditorial, pas sur le libellé : « À relire »
      // ne vient pas avant « Brouillon » dans le processus, seulement dans
      // l'alphabet.
      sortValue: (ligne) => CONTENT_STATUSES.indexOf(ligne.status),
      cell: (ligne) => <StatusBadge status={ligne.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Galerie"
        description="Les photos de la page Galerie. Chacune vient de la médiathèque : c'est là que se corrige sa description, et ici qu'on décide de son classement et de son ordre."
        actions={
          <>
            <Button
              type="button"
              variant="outline"
              onClick={() => setCategoriesOuvertes(true)}
            >
              <FolderOpen className="size-4" aria-hidden="true" />
              Gérer les catégories
            </Button>

            {peutCreer ? (
              <Button asChild>
                <Link href="/dashboard/galerie/nouveau">
                  <Plus className="size-4" aria-hidden="true" />
                  Ajouter une photo
                </Link>
              </Button>
            ) : null}
          </>
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Ce que le SITE montre — pas ce que ce tableau contient              */}
      {/* ------------------------------------------------------------------ */}
      {elements.length > 0 ? (
        <div
          role="status"
          className={
            doublons.size > 0 || sansMedia > 0
              ? "flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
              : "flex gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
          }
        >
          <TriangleAlert
            className={
              doublons.size > 0 || sansMedia > 0
                ? "mt-0.5 size-4 shrink-0 text-destructive"
                : "mt-0.5 size-4 shrink-0 text-muted-foreground"
            }
            aria-hidden="true"
          />

          <div className="flex flex-col gap-2 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                {publies.length === 0
                  ? "Aucune photo n'est en ligne."
                  : `${publies.length} photo${publies.length > 1 ? "s" : ""} en ligne`}
              </span>{" "}
              {publies.length > 0 ? (
                <>
                  —{" "}
                  {filtresRendus.length === 0
                    ? "aucun bouton de filtre n'est affiché"
                    : `${filtresRendus.length} bouton${filtresRendus.length > 1 ? "s" : ""} de filtre : ${filtresRendus
                        .map((categorie) => `« ${categorie.label} »`)
                        .join(", ")}`}
                  . La page Galerie les montre toutes dans « Tous ».
                </>
              ) : (
                <>
                  La grille et ses boutons de filtre disparaissent de la page
                  Galerie plutôt que d&apos;annoncer un contenu absent.
                </>
              )}
            </p>

            {publiesSansCategorie > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {publiesSansCategorie === 1
                    ? "Une photo en ligne n'a pas de catégorie."
                    : `${publiesSansCategorie} photos en ligne n'ont pas de catégorie.`}
                </span>{" "}
                {publiesSansCategorie === 1 ? "Elle apparaît" : "Elles apparaissent"}{" "}
                dans « Tous », mais aucun bouton de filtre ne{" "}
                {publiesSansCategorie === 1 ? "l'atteint" : "les atteint"}.
              </p>
            ) : null}

            {categoriesVides.length > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {categoriesVides.length === 1
                    ? `La catégorie « ${categoriesVides[0]!.label} » n'a aucune photo en ligne.`
                    : `${categoriesVides.length} catégories n'ont aucune photo en ligne.`}
                </span>{" "}
                Leur bouton de filtre n&apos;apparaît pas : un filtre qui mène à
                une grille vide passe pour une panne.
              </p>
            ) : null}

            {doublons.size > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {doublons.size === 1
                    ? "Une photo figure deux fois dans la galerie."
                    : `${doublons.size} photos figurent deux fois dans la galerie.`}
                </span>{" "}
                Les visiteurs verraient la même image en double. Retirez
                l&apos;un des deux éléments — le fichier, lui, reste dans la
                médiathèque.
              </p>
            ) : null}

            {sansMedia > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {sansMedia === 1
                    ? "La photo d'un élément n'a pas pu être chargée."
                    : `Les photos de ${sansMedia} éléments n'ont pas pu être chargées.`}
                </span>{" "}
                Ouvrez l&apos;élément concerné et choisissez une autre image.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/*
        La liste est bornée à 100 lignes (voir la page). Tant que le total tient
        dessous, le filtrage en mémoire du `<DataTable>` est exact ; au-delà, il
        porterait sur une tranche sans que rien ne le dise. On le dit.

        ⚠️  C'est la collection du projet la plus susceptible d'y arriver : une
        association dépose des photos après chaque action de terrain, et rien ne
        pousse jamais à en retirer.
      */}
      {total > elements.length ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
        >
          Les {elements.length} premières photos de la grille sont affichées, sur{" "}
          {total} au total. La recherche et les filtres ne portent que sur cette
          sélection.
        </p>
      ) : null}

      <DataTable<LigneGalerie>
        data={lignes}
        columns={colonnes}
        getRowId={(ligne) => ligne.id}
        primaryColumnKey="description"
        badgeColumnKey="status"
        itemLabel="photo"
        emptyState={{
          title: "Aucune photo dans la galerie",
          description:
            "Téléversez d'abord vos photos dans la médiathèque, puis ajoutez-les ici : elles apparaîtront en brouillon, et ne seront visibles sur le site qu'une fois publiées.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/galerie/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Ajouter une photo
              </Link>
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher une photo…",
          keys: ["description", "nomFichier", "categorie"],
        }}
        filters={[
          {
            key: "status",
            label: "État",
            options: CONTENT_STATUSES.map((statut) => ({
              value: statut,
              label: CONTENT_STATUS_LABELS[statut],
            })),
            match: (ligne, valeur) => ligne.status === valeur,
          },
          {
            key: "categorie",
            label: "Catégorie",
            options: [
              ...categories.map((categorie) => ({
                value: categorie.id,
                label: categorie.label,
              })),
              // Le classement manquant est une VALEUR de filtre, pas l'absence
              // de filtre : c'est ainsi qu'on retrouve les photos à ranger.
              { value: "aucune", label: CATEGORIE_ABSENTE },
            ],
            match: (ligne, valeur) =>
              valeur === "aucune"
                ? ligne.categoryId === null
                : ligne.categoryId === valeur,
          },
        ]}
        pagination={{ pageSize: 10 }}
        reorder={
          peutReordonner
            ? {
                onReorder: async (ordre) => {
                  const resultat = await reordonnerElementsGalerieAction({
                    orderedIds: ordre,
                  });

                  // `<DataTable>` remet l'ordre du serveur et le dit si cette
                  // promesse échoue : c'est son contrat, on le respecte.
                  if (!resultat.ok) throw new Error(resultat.message);

                  router.refresh();
                },
              }
            : undefined
        }
        selection={
          peutPublier || peutSupprimer
            ? {
                actions: [
                  ...(peutPublier
                    ? [
                        {
                          key: "publier",
                          label: "Publier",
                          icon: ArrowUpFromLine,
                        },
                        { key: "depublier", label: "Dépublier", icon: Undo2 },
                      ]
                    : []),
                  ...(peutSupprimer
                    ? [
                        {
                          key: "supprimer",
                          label: "Retirer",
                          icon: Trash2,
                          variant: "destructive" as const,
                        },
                      ]
                    : []),
                ],
                onBulk: (ids, action) => {
                  if (action.key === "supprimer") {
                    setASupprimerEnLot(ids);
                    return;
                  }

                  const cible: ContentStatus =
                    action.key === "publier" ? "published" : "draft";

                  void appliquerEnLot(
                    ids,
                    async (ligne) => {
                      const resultat = await changerStatutElementGalerieAction({
                        id: ligne.id,
                        status: cible,
                      });
                      return resultat.ok;
                    },
                    (reussites, echecs) =>
                      echecs === 0
                        ? `${reussites} photo${reussites > 1 ? "s" : ""} ${cible === "published" ? "publiée" : "dépubliée"}${reussites > 1 ? "s" : ""}.`
                        : `${reussites} traitée${reussites > 1 ? "s" : ""}, ${echecs} refusée${echecs > 1 ? "s" : ""} — ouvrez les éléments concernés pour connaître le motif.`,
                  );
                },
              }
            : undefined
        }
        rowActions={(ligne) => [
          {
            label: peutModifier ? "Modifier" : "Ouvrir l'élément",
            icon: Pencil,
            onSelect: () => router.push(`/dashboard/galerie/${ligne.id}`),
          },
          ...(peutPublier
            ? [
                ligne.status === "published"
                  ? {
                      label: "Dépublier",
                      icon: Undo2,
                      onSelect: () => void changerStatut(ligne, "draft"),
                    }
                  : {
                      label: "Publier",
                      icon: ArrowUpFromLine,
                      onSelect: () => void changerStatut(ligne, "published"),
                    },
              ]
            : []),
          ...(peutSupprimer
            ? [
                {
                  label: "Retirer de la galerie",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(ligne),
                },
              ]
            : []),
        ]}
      />

      <GalleryCategoriesModal
        open={categoriesOuvertes}
        onOpenChange={setCategoriesOuvertes}
        categories={categories}
        comptesParCategorie={comptesParCategorie}
        /*
          Les droits des catégories ne sont PAS ceux des éléments : la RLS
          réserve l'ajout et la suppression aux administrateurs, alors qu'un
          éditeur peut créer un élément de galerie. Voir l'en-tête de
          `gallery-categories.actions.ts` — les permissions passées ici sont
          celles que les actions exigent réellement, pas des approximations.
        */
        peutCreer={peutPublier}
        peutRenommer={peutModifier}
        peutSupprimer={peutSupprimer}
        peutReordonner={peutReordonner}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Confirmations — elles NOMMENT ce qui va disparaître (§6.4)          */}
      {/* ------------------------------------------------------------------ */}
      <ConfirmDialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        title={
          aSupprimer
            ? `Retirer « ${aSupprimer.description || aSupprimer.nomFichier || "cette photo"} » de la galerie ?`
            : "Retirer cette photo de la galerie ?"
        }
        description="La photo disparaît de la grille du site. Le FICHIER, lui, reste dans la médiathèque et peut être réutilisé ailleurs — pour le supprimer définitivement, passez par la médiathèque."
        confirmLabel="Retirer de la galerie"
        onConfirm={async () => {
          if (aSupprimer) await supprimer(aSupprimer);
          setASupprimer(null);
        }}
      />

      <ConfirmDialog
        open={aSupprimerEnLot !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimerEnLot(null);
        }}
        title={
          aSupprimerEnLot
            ? `Retirer ${aSupprimerEnLot.length} photo${aSupprimerEnLot.length > 1 ? "s" : ""} de la galerie ?`
            : "Retirer ces photos de la galerie ?"
        }
        description="Les photos disparaissent de la grille du site. Les FICHIERS restent dans la médiathèque et peuvent être réutilisés ailleurs."
        confirmLabel="Retirer"
        onConfirm={async () => {
          const ids = aSupprimerEnLot ?? [];
          setASupprimerEnLot(null);

          await appliquerEnLot(
            ids,
            async (ligne) => {
              const resultat = await supprimerElementGalerieAction({
                id: ligne.id,
              });
              return resultat.ok;
            },
            (reussites, echecs) =>
              echecs === 0
                ? `${reussites} photo${reussites > 1 ? "s" : ""} retirée${reussites > 1 ? "s" : ""} de la galerie.`
                : `${reussites} retirée${reussites > 1 ? "s" : ""}, ${echecs} conservée${echecs > 1 ? "s" : ""}. Ouvrez les éléments concernés pour connaître le motif.`,
          );
        }}
      />
    </div>
  );
}
