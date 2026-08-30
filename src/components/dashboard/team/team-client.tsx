"use client";

import {
  ArrowUpFromLine,
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
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { estNomAFournir, type TeamMember } from "@/core/cms/entities/team-member";
import {
  changerStatutMembreEquipeAction,
  reordonnerMembresEquipeAction,
  supprimerMembreEquipeAction,
} from "@/server/actions/team.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { MediaThumbnail } from "../media/media-thumbnail";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/equipe`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8D du Rapport 2, transposition du gabarit du §8A.3 : glissière de
 * réordonnancement · Photo · Nom · Fonction · Biographie · État · Actions.
 * Filtres : état, nom, photo. Recherche : nom, fonction, biographie. Actions
 * groupées : publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * LE BANDEAU DIT CE QUE LE SITE MONTRE, PAS CE QUE LE TABLEAU CONTIENT
 * ---------------------------------------------------------------------------
 * C'est la seule collection du Lot 8 dont AUCUNE ligne n'est publiée. Le
 * tableau affiche trois fiches ; la page « Qui sommes-nous », elle, n'affiche
 * rien du tout — sa section « L'équipe » disparaît entièrement.
 *
 * Un écran qui montrerait trois lignes sans le dire laisserait croire que la
 * page publique en montre trois aussi. C'est la confusion la plus coûteuse
 * d'un CMS, et elle est ici la situation par défaut : le bandeau existe pour
 * ça, et il donne la marche à suivre plutôt que le constat.
 *
 * C'est aussi la contrepartie d'une décision de ce lot : le rappel
 * « à compléter » a été RETIRÉ de la page publique, où il s'adressait aux
 * visiteurs, et déplacé ici, où quelqu'un peut agir.
 */

export function TeamClient({
  membres: membresInitiaux,
  photos,
  peutCreer,
  peutModifier,
  peutPublier,
  peutSupprimer,
  peutReordonner,
}: {
  membres: TeamMember[];
  /** Portraits déjà résolus côté serveur, indexés par identifiant de média. */
  photos: Record<string, MediaAsset>;
  peutCreer: boolean;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<TeamMember | null>(null);
  const [aSupprimerEnLot, setASupprimerEnLot] = useState<string[] | null>(null);

  const publies = membresInitiaux.filter((m) => m.status === "published");
  const nomsAFournir = membresInitiaux.filter((m) => estNomAFournir(m.name));

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function changerStatut(membre: TeamMember, status: ContentStatus) {
    const resultat = await changerStatutMembreEquipeAction({
      id: membre.id,
      status,
    });

    if (!resultat.ok) {
      /*
        C'est ici que remonte le refus de publier une fiche dont le nom est
        resté « [À COMPLÉTER] ». Le message est long parce qu'il dit quoi
        faire, et il reste affiché longtemps : le lire à moitié conduirait à
        croire à une panne.
      */
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? `La fiche de ${membre.name} est en ligne.`
        : `La fiche de ${membre.name} n'est plus visible sur le site.`,
    );
    router.refresh();
  }

  async function supprimer(membre: TeamMember) {
    const resultat = await supprimerMembreEquipeAction({ id: membre.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(`La fiche de ${membre.name} a été supprimée.`);
    router.refresh();
  }

  /**
   * Actions groupées.
   *
   * Séquentielles et non parallèles : chaque suppression renumérote les
   * positions restantes (voir `deleteTeamMember`), et deux renumérotations
   * concurrentes produiraient un ordre que personne n'a voulu.
   */
  async function appliquerEnLot(
    ids: string[],
    traiter: (membre: TeamMember) => Promise<boolean>,
    resume: (reussites: number, echecs: number) => string,
  ) {
    let reussites = 0;
    let echecs = 0;

    for (const id of ids) {
      const membre = membresInitiaux.find((m) => m.id === id);
      if (!membre) continue;
      if (await traiter(membre)) reussites += 1;
      else echecs += 1;
    }

    if (echecs === 0) toast.success(resume(reussites, echecs));
    else toast.error(resume(reussites, echecs), { duration: 10000 });

    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Colonnes                                                                */
  /* ---------------------------------------------------------------------- */

  const colonnes: Column<TeamMember>[] = [
    {
      key: "photo",
      header: "Photo",
      width: "4.5rem",
      cell: (membre) => {
        const media = membre.photoMediaId
          ? photos[membre.photoMediaId]
          : undefined;

        return (
          <span className="block w-11 overflow-hidden rounded-full">
            {media ? (
              <MediaThumbnail asset={media} sizes="44px" />
            ) : (
              /*
                Pas de photo : on le DIT plutôt que de laisser une case vide,
                qu'on prendrait pour un défaut de chargement.
              */
              <span
                title="Aucune photo choisie"
                className="flex aspect-square w-full items-center justify-center rounded-full bg-muted text-muted-foreground"
              >
                <ImageOff className="size-4" aria-hidden="true" />
                <span className="sr-only">Aucune photo</span>
              </span>
            )}
          </span>
        );
      },
    },
    {
      key: "name",
      header: "Nom",
      sortable: true,
      sortValue: (membre) => membre.name,
      cell: (membre) => {
        const aFournir = estNomAFournir(membre.name);

        return (
          <span className="flex min-w-0 flex-col">
            <span
              className={
                aFournir
                  ? "inline-flex items-center gap-1.5 truncate font-medium text-destructive"
                  : "truncate font-medium text-foreground"
              }
            >
              {aFournir ? (
                <TriangleAlert className="size-4 shrink-0" aria-hidden="true" />
              ) : null}
              {membre.name}
            </span>
            {/*
              Le motif est écrit en toutes lettres, pas seulement porté par la
              couleur et l'icône : une information rendue par la seule couleur
              est invisible pour un lecteur d'écran, et c'est celle qui explique
              pourquoi « Publier » est grisé sur cette ligne.
            */}
            {aFournir ? (
              <span className="text-xs text-destructive">
                Nom à fournir — publication impossible
              </span>
            ) : membre.bio ? (
              <span className="line-clamp-2 text-xs text-muted-foreground">
                {membre.bio}
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "role",
      header: "Fonction",
      sortable: true,
      sortValue: (membre) => membre.role,
      cell: (membre) => (
        <span className="truncate text-muted-foreground">{membre.role}</span>
      ),
    },
    {
      key: "bio",
      header: "Biographie",
      hideOnMobile: true,
      cell: (membre) =>
        membre.bio ? (
          <span className="line-clamp-2 text-muted-foreground">{membre.bio}</span>
        ) : (
          // Invariant nº 1 : une absence est DITE, elle n'est pas une case vide.
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "État",
      sortable: true,
      // Trier sur le RANG du cycle éditorial, pas sur le libellé : « À relire »
      // ne vient pas avant « Brouillon » dans le processus, seulement dans
      // l'alphabet.
      sortValue: (membre) => CONTENT_STATUSES.indexOf(membre.status),
      cell: (membre) => <StatusBadge status={membre.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Équipe"
        description="Les personnes qui portent l'association, telles qu'elles apparaissent sur la page « Qui sommes-nous ». L'ordre ici est celui du site : il se lit comme un organigramme."
        actions={
          peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/equipe/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle fiche
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Ce que le SITE montre — pas ce que ce tableau contient              */}
      {/* ------------------------------------------------------------------ */}
      {membresInitiaux.length > 0 && (publies.length === 0 || nomsAFournir.length > 0) ? (
        <div
          role="status"
          className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <div className="flex flex-col gap-2 text-muted-foreground">
            {publies.length === 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  La section « L&apos;équipe » n&apos;apparaît pas sur le site.
                </span>{" "}
                Aucune fiche n&apos;est publiée, et la page « Qui sommes-nous »
                masque la section entière plutôt que d&apos;annoncer un contenu
                absent.
              </p>
            ) : null}

            {nomsAFournir.length > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {nomsAFournir.length === 1
                    ? "Une fiche attend encore le nom de la personne."
                    : `${nomsAFournir.length} fiches attendent encore le nom de la personne.`}
                </span>{" "}
                {nomsAFournir.length === 1 ? "Elle date" : "Elles datent"} de la
                reprise du contenu du site, où aucun nom n&apos;avait été
                inventé. Remplacez « [À COMPLÉTER] » par le nom réel, puis
                publiez.{" "}
                {nomsAFournir.length === 1
                  ? "Tant que le marqueur y figure, cette fiche ne peut pas être mise en ligne."
                  : "Tant que le marqueur y figure, ces fiches ne peuvent pas être mises en ligne."}
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <DataTable<TeamMember>
        data={membresInitiaux}
        columns={colonnes}
        getRowId={(membre) => membre.id}
        primaryColumnKey="name"
        badgeColumnKey="status"
        itemLabel="fiche"
        emptyState={{
          title: "Aucune fiche d'équipe pour l'instant",
          description:
            "Créez votre première fiche : elle apparaîtra ici en brouillon, et ne sera visible sur la page « Qui sommes-nous » qu'une fois publiée.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/equipe/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle fiche
              </Link>
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher une personne…",
          keys: ["name", "role", "bio"],
        }}
        filters={[
          {
            key: "status",
            label: "État",
            options: CONTENT_STATUSES.map((statut) => ({
              value: statut,
              label: CONTENT_STATUS_LABELS[statut],
            })),
            match: (membre, valeur) => membre.status === valeur,
          },
          {
            key: "name",
            label: "Nom",
            options: [
              { value: "a-fournir", label: "Nom à fournir" },
              { value: "renseigne", label: "Nom renseigné" },
            ],
            match: (membre, valeur) =>
              valeur === "a-fournir"
                ? estNomAFournir(membre.name)
                : !estNomAFournir(membre.name),
          },
          {
            key: "photoMediaId",
            label: "Photo",
            options: [
              { value: "avec", label: "Avec photo" },
              { value: "sans", label: "Sans photo" },
            ],
            match: (membre, valeur) =>
              valeur === "avec"
                ? membre.photoMediaId !== null
                : membre.photoMediaId === null,
          },
        ]}
        pagination={{ pageSize: 10 }}
        reorder={
          peutReordonner
            ? {
                onReorder: async (ordre) => {
                  const resultat = await reordonnerMembresEquipeAction({
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
                    async (membre) => {
                      const resultat = await changerStatutMembreEquipeAction({
                        id: membre.id,
                        status: cible,
                      });
                      return resultat.ok;
                    },
                    (reussites, echecs) =>
                      echecs === 0
                        ? `${reussites} fiche${reussites > 1 ? "s" : ""} ${cible === "published" ? "publiée" : "dépubliée"}${reussites > 1 ? "s" : ""}.`
                        : /*
                            Le motif le plus probable d'un refus en lot est le
                            nom resté « [À COMPLÉTER] ». Il est nommé : « ouvrez
                            les fiches concernées » enverrait chercher une
                            information qu'on connaît déjà.
                          */
                          `${reussites} traitée${reussites > 1 ? "s" : ""}, ${echecs} refusée${echecs > 1 ? "s" : ""} — le plus souvent parce que le nom de la personne reste à fournir. Filtrez sur « Nom à fournir » pour les retrouver.`,
                  );
                },
              }
            : undefined
        }
        rowActions={(membre) => [
          {
            label: peutModifier ? "Modifier" : "Ouvrir la fiche",
            icon: Pencil,
            onSelect: () => router.push(`/dashboard/equipe/${membre.id}`),
          },
          ...(peutPublier
            ? [
                membre.status === "published"
                  ? {
                      label: "Dépublier",
                      icon: Undo2,
                      onSelect: () => void changerStatut(membre, "draft"),
                    }
                  : {
                      label: "Publier",
                      icon: ArrowUpFromLine,
                      /*
                        Désactivé, avec le motif : la Server Action refuserait
                        de toute façon, et laisser cliquer pour afficher une
                        erreur, c'est promettre puis reprendre. `disabledReason`
                        existe pour ça (§6.1).
                      */
                      disabled: estNomAFournir(membre.name),
                      disabledReason:
                        "Le nom de la personne est encore « [À COMPLÉTER] ».",
                      onSelect: () => void changerStatut(membre, "published"),
                    },
              ]
            : []),
          ...(peutSupprimer
            ? [
                {
                  label: "Supprimer",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(membre),
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
            ? `Supprimer la fiche de ${aSupprimer.name} ?`
            : "Supprimer cette fiche ?"
        }
        description="La fiche disparaît du site et de la base. Cette action est définitive. La photo, elle, reste dans la médiathèque : elle peut servir ailleurs."
        confirmLabel="Supprimer la fiche"
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
            ? `Supprimer ${aSupprimerEnLot.length} fiche${aSupprimerEnLot.length > 1 ? "s" : ""} ?`
            : "Supprimer ces fiches ?"
        }
        description="Les fiches disparaissent du site et de la base. Cette action est définitive. Les photos, elles, restent dans la médiathèque."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const ids = aSupprimerEnLot ?? [];
          setASupprimerEnLot(null);

          await appliquerEnLot(
            ids,
            async (membre) => {
              const resultat = await supprimerMembreEquipeAction({
                id: membre.id,
              });
              return resultat.ok;
            },
            (reussites, echecs) =>
              echecs === 0
                ? `${reussites} fiche${reussites > 1 ? "s" : ""} supprimée${reussites > 1 ? "s" : ""}.`
                : `${reussites} supprimée${reussites > 1 ? "s" : ""}, ${echecs} conservée${echecs > 1 ? "s" : ""}. Ouvrez les fiches concernées pour connaître le motif.`,
          );
        }}
      />
    </div>
  );
}
