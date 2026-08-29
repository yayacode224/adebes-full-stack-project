"use client";

import {
  ArrowUpFromLine,
  ExternalLink,
  ImageOff,
  Pencil,
  Plus,
  Trash2,
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
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { MEDIA_TONES, MEDIA_TONE_LABELS } from "@/core/cms/entities/media-tone";
import type { Programme } from "@/core/cms/entities/programme";
import {
  changerStatutProgrammeAction,
  reordonnerProgrammesAction,
  supprimerProgrammeAction,
} from "@/server/actions/programmes.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { MediaThumbnail } from "../media/media-thumbnail";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/programmes`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8A.3 du Rapport 2 : « Colonnes : glissière de réordonnancement · Couverture ·
 * Titre · Adresse · Statut · Modifié le · Actions. Filtres : statut, teinte.
 * Recherche : titre et résumé. Actions groupées : publier, dépublier,
 * supprimer. »
 *
 * ---------------------------------------------------------------------------
 * `<DataTable>` EST UTILISÉ AVEC TOUTES SES PROPS, CONTRAIREMENT À LA
 * MÉDIATHÈQUE
 * ---------------------------------------------------------------------------
 * Ce n'est pas une incohérence mais la même règle appliquée à des volumes
 * différents (écart nº 51) : huit programmes tiennent en mémoire, et une
 * pagination serveur imposerait un aller-retour par frappe dans la recherche.
 * La médiathèque, elle, grossit sans limite.
 *
 * La glissière de réordonnancement, « Monter » / « Descendre » et le blocage
 * du réordonnancement pendant un tri viennent du composant : ils ne sont pas
 * réécrits ici, et ne le seront pas davantage aux lots 8B → 8I.
 *
 * ---------------------------------------------------------------------------
 * LES PERMISSIONS SONT CALCULÉES SUR LE SERVEUR ET REÇUES EN PROPS
 * ---------------------------------------------------------------------------
 * Un bouton « Publier » rendu puis refusé au clic est une promesse non tenue.
 * Les Server Actions revérifient de toute façon — c'est la deuxième barrière
 * du §9 — et la RLS est la troisième : masquer un bouton est du confort, pas
 * une sécurité.
 */
export function ProgrammesClient({
  programmes: programmesInitiaux,
  couvertures,
  peutCreer,
  peutModifier,
  peutPublier,
  peutSupprimer,
  peutReordonner,
}: {
  programmes: Programme[];
  /** Couvertures déjà résolues côté serveur, indexées par identifiant de média. */
  couvertures: Record<string, MediaAsset>;
  peutCreer: boolean;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<Programme | null>(null);
  const [aSupprimerEnLot, setASupprimerEnLot] = useState<string[] | null>(null);

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function changerStatut(programme: Programme, status: ContentStatus) {
    const resultat = await changerStatutProgrammeAction({
      id: programme.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    toast.success(
      status === "published"
        ? `« ${programme.title} » est en ligne.`
        : `« ${programme.title} » n'est plus visible sur le site.`,
    );
    router.refresh();
  }

  async function supprimer(programme: Programme) {
    const resultat = await supprimerProgrammeAction({ id: programme.id });

    if (!resultat.ok) {
      /*
        Le cas de recette du §8A : un programme cité par un témoignage est
        refusé par la base (`on delete restrict`). Le message est celui du
        dépôt, en français, et il est affiché LONGTEMPS — il explique quoi
        faire avant de réessayer, pas seulement que ça a échoué.
      */
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(`« ${programme.title} » a été supprimé.`);
    router.refresh();
  }

  /**
   * Actions groupées.
   *
   * Séquentielles et non parallèles : chaque suppression renumérote les
   * positions restantes (voir `deleteProgramme`), et deux renumérotations
   * concurrentes produiraient un ordre que personne n'a voulu.
   */
  async function appliquerEnLot(
    ids: string[],
    traiter: (programme: Programme) => Promise<boolean>,
    resume: (reussites: number, echecs: number) => string,
  ) {
    let reussites = 0;
    let echecs = 0;

    for (const id of ids) {
      const programme = programmesInitiaux.find((p) => p.id === id);
      if (!programme) continue;
      if (await traiter(programme)) reussites += 1;
      else echecs += 1;
    }

    if (echecs === 0) toast.success(resume(reussites, echecs));
    else toast.error(resume(reussites, echecs), { duration: 10000 });

    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Colonnes                                                                */
  /* ---------------------------------------------------------------------- */

  const colonnes: Column<Programme>[] = [
    {
      key: "couverture",
      header: "Couverture",
      width: "5rem",
      cell: (programme) => {
        const media = programme.coverMediaId
          ? couvertures[programme.coverMediaId]
          : undefined;

        return (
          <span className="block w-14 overflow-hidden rounded-md">
            {media ? (
              <MediaThumbnail asset={media} sizes="56px" />
            ) : (
              /*
                Pas d'image : on le DIT plutôt que de laisser une case vide,
                qu'on prendrait pour un défaut de chargement. Le site public,
                lui, garde pour l'instant le visuel livré dans `/public`.
              */
              <span
                title="Aucune image de couverture choisie"
                className="flex aspect-square w-full items-center justify-center rounded-md bg-muted text-muted-foreground"
              >
                <ImageOff className="size-4" aria-hidden="true" />
                <span className="sr-only">Aucune image de couverture</span>
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "title",
      header: "Titre",
      sortable: true,
      sortValue: (programme) => programme.title,
      cell: (programme) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">
            {programme.title}
          </span>
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {programme.summary}
          </span>
        </span>
      ),
    },
    {
      key: "slug",
      header: "Adresse",
      sortable: true,
      sortValue: (programme) => programme.slug,
      hideOnMobile: true,
      cell: (programme) => (
        <span className="truncate font-mono text-xs text-muted-foreground">
          /programmes/{programme.slug}
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
      sortValue: (programme) => CONTENT_STATUSES.indexOf(programme.status),
      cell: (programme) => <StatusBadge status={programme.status} />,
    },
    {
      key: "updatedAt",
      header: "Modifié le",
      align: "end",
      sortable: true,
      sortValue: (programme) => new Date(programme.updatedAt),
      hideOnMobile: true,
      cell: (programme) => (
        <time dateTime={programme.updatedAt} className="text-muted-foreground">
          {formaterDate(programme.updatedAt)}
        </time>
      ),
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Programmes"
        description="Les domaines d'intervention de l'association. Leur ordre ici est celui de leur affichage sur le site."
        actions={
          peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/programmes/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouveau programme
              </Link>
            </Button>
          ) : undefined
        }
      />

      <DataTable<Programme>
        data={programmesInitiaux}
        columns={colonnes}
        getRowId={(programme) => programme.id}
        primaryColumnKey="title"
        badgeColumnKey="status"
        itemLabel="programme"
        emptyState={{
          title: "Aucun programme pour l'instant",
          description:
            "Créez votre premier programme : il apparaîtra ici en brouillon, et ne sera visible sur le site qu'une fois publié.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/programmes/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouveau programme
              </Link>
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher un programme…",
          keys: ["title", "summary"],
        }}
        filters={[
          {
            key: "status",
            label: "État",
            options: CONTENT_STATUSES.map((statut) => ({
              value: statut,
              label: CONTENT_STATUS_LABELS[statut],
            })),
            match: (programme, valeur) => programme.status === valeur,
          },
          {
            key: "tone",
            label: "Teinte",
            options: MEDIA_TONES.map((teinte) => ({
              value: teinte,
              label: MEDIA_TONE_LABELS[teinte],
            })),
            match: (programme, valeur) => programme.tone === valeur,
          },
        ]}
        pagination={{ pageSize: 10 }}
        reorder={
          peutReordonner
            ? {
                onReorder: async (ordre) => {
                  const resultat = await reordonnerProgrammesAction({
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
                          label: "Supprimer",
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
                    async (programme) => {
                      const resultat = await changerStatutProgrammeAction({
                        id: programme.id,
                        status: cible,
                      });
                      return resultat.ok;
                    },
                    (reussites, echecs) =>
                      echecs === 0
                        ? `${reussites} programme${reussites > 1 ? "s" : ""} ${cible === "published" ? "publié" : "dépublié"}${reussites > 1 ? "s" : ""}.`
                        : `${reussites} traité${reussites > 1 ? "s" : ""}, ${echecs} refusé${echecs > 1 ? "s" : ""}. Ouvrez les fiches concernées pour connaître le motif.`,
                  );
                },
              }
            : undefined
        }
        rowActions={(programme) => [
          {
            label: peutModifier ? "Modifier" : "Ouvrir la fiche",
            icon: Pencil,
            onSelect: () => router.push(`/dashboard/programmes/${programme.id}`),
          },
          ...(programme.status === "published"
            ? [
                {
                  label: "Voir sur le site",
                  icon: ExternalLink,
                  onSelect: () =>
                    window.open(
                      `/programmes/${programme.slug}`,
                      "_blank",
                      "noopener,noreferrer",
                    ),
                },
              ]
            : []),
          ...(peutPublier
            ? [
                programme.status === "published"
                  ? {
                      label: "Dépublier",
                      icon: Undo2,
                      onSelect: () => void changerStatut(programme, "draft"),
                    }
                  : {
                      label: "Publier",
                      icon: ArrowUpFromLine,
                      onSelect: () => void changerStatut(programme, "published"),
                    },
              ]
            : []),
          ...(peutSupprimer
            ? [
                {
                  label: "Supprimer",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(programme),
                },
              ]
            : []),
        ]}
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
            ? `Supprimer « ${aSupprimer.title} » ?`
            : "Supprimer ce programme ?"
        }
        description="Le programme et sa page disparaissent du site. Cette action est définitive. Si un témoignage y est rattaché, la suppression sera refusée et vous serez prévenu."
        confirmLabel="Supprimer le programme"
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
            ? `Supprimer ${aSupprimerEnLot.length} programme${aSupprimerEnLot.length > 1 ? "s" : ""} ?`
            : "Supprimer ces programmes ?"
        }
        description="Leurs pages disparaissent du site. Cette action est définitive. Un programme rattaché à un témoignage sera conservé, et vous en serez averti."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const ids = aSupprimerEnLot ?? [];
          setASupprimerEnLot(null);

          await appliquerEnLot(
            ids,
            async (programme) => {
              const resultat = await supprimerProgrammeAction({
                id: programme.id,
              });
              return resultat.ok;
            },
            (reussites, echecs) =>
              echecs === 0
                ? `${reussites} programme${reussites > 1 ? "s" : ""} supprimé${reussites > 1 ? "s" : ""}.`
                : `${reussites} supprimé${reussites > 1 ? "s" : ""}, ${echecs} conservé${echecs > 1 ? "s" : ""} : ${echecs > 1 ? "ils sont utilisés" : "il est utilisé"} par un témoignage.`,
          );
        }}
      />
    </div>
  );
}

/** Fuseau explicite : sans lui, le serveur formate en UTC. */
function formaterDate(iso: string): string {
  return new Intl.DateTimeFormat("fr-FR", {
    day: "numeric",
    month: "short",
    year: "numeric",
    timeZone: "Africa/Douala",
  }).format(new Date(iso));
}
