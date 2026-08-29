"use client";

import {
  ArrowUpFromLine,
  ImageOff,
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
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
import type { Testimonial } from "@/core/cms/entities/testimonial";
import {
  changerStatutTemoignageAction,
  reordonnerTemoignagesAction,
  supprimerTemoignageAction,
} from "@/server/actions/testimonials.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { MediaThumbnail } from "../media/media-thumbnail";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/temoignages`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8C du Rapport 2, transposition du gabarit du §8A.3 : glissière de
 * réordonnancement · Photo · Citation · Rôle · Programme · Accord · État ·
 * Actions. Filtres : état, accord, programme. Recherche : citation, prénom,
 * rôle. Actions groupées : publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * UNE COLONNE « ACCORD » QUE LES AUTRES COLLECTIONS N'ONT PAS
 * ---------------------------------------------------------------------------
 * Elle porte un texte, pas seulement une icône : une information rendue par la
 * seule couleur ou la seule forme est invisible pour un lecteur d'écran, et
 * celle-ci est la plus importante de l'écran.
 *
 * Elle sert aussi à repérer d'un coup d'œil les lignes **en ligne sans
 * accord** — l'état hérité du seed, expliqué dans
 * `server/queries/testimonials.query.ts`. Le compte de ces lignes est rappelé
 * en tête de page : les enterrer dans un tableau de vingt lignes reviendrait à
 * ne pas les signaler.
 *
 * ---------------------------------------------------------------------------
 * L'ORDRE CHOISI ICI DÉCIDE DE CE QUI EST VISIBLE
 * ---------------------------------------------------------------------------
 * L'accueil n'affiche que les TROIS PREMIERS témoignages publiés. Réordonner
 * n'est donc pas seulement esthétique, et la description de la page le dit.
 */

/** Ce que l'accueil affiche — voir `src/app/(site)/page.tsx`. */
const VISIBLES_SUR_ACCUEIL = 3;

export function TestimonialsClient({
  temoignages: temoignagesInitiaux,
  photos,
  programmes,
  peutCreer,
  peutModifier,
  peutPublier,
  peutSupprimer,
  peutReordonner,
}: {
  temoignages: Testimonial[];
  /** Portraits déjà résolus côté serveur, indexés par identifiant de média. */
  photos: Record<string, MediaAsset>;
  /** Titre court de chaque programme, indexé par identifiant. */
  programmes: Record<string, string>;
  peutCreer: boolean;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<Testimonial | null>(null);
  const [aSupprimerEnLot, setASupprimerEnLot] = useState<string[] | null>(null);

  const enLigneSansAccord = temoignagesInitiaux.filter(
    (t) => t.status === "published" && !t.hasConsent,
  );

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function changerStatut(temoignage: Testimonial, status: ContentStatus) {
    const resultat = await changerStatutTemoignageAction({
      id: temoignage.id,
      status,
    });

    if (!resultat.ok) {
      /*
        C'est ici que remonte le refus de publier sans accord. Le message est
        long parce qu'il dit quoi faire, et il reste affiché longtemps : le
        lire à moitié conduirait à croire à une panne.
      */
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? `Le témoignage de ${temoignage.authorName} est en ligne.`
        : `Le témoignage de ${temoignage.authorName} n'est plus visible sur le site.`,
    );
    router.refresh();
  }

  async function supprimer(temoignage: Testimonial) {
    const resultat = await supprimerTemoignageAction({ id: temoignage.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(`Le témoignage de ${temoignage.authorName} a été supprimé.`);
    router.refresh();
  }

  /**
   * Actions groupées.
   *
   * Séquentielles et non parallèles : chaque suppression renumérote les
   * positions restantes (voir `deleteTestimonial`), et deux renumérotations
   * concurrentes produiraient un ordre que personne n'a voulu.
   */
  async function appliquerEnLot(
    ids: string[],
    traiter: (temoignage: Testimonial) => Promise<boolean>,
    resume: (reussites: number, echecs: number) => string,
  ) {
    let reussites = 0;
    let echecs = 0;

    for (const id of ids) {
      const temoignage = temoignagesInitiaux.find((t) => t.id === id);
      if (!temoignage) continue;
      if (await traiter(temoignage)) reussites += 1;
      else echecs += 1;
    }

    if (echecs === 0) toast.success(resume(reussites, echecs));
    else toast.error(resume(reussites, echecs), { duration: 10000 });

    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Colonnes                                                                */
  /* ---------------------------------------------------------------------- */

  const colonnes: Column<Testimonial>[] = [
    {
      key: "photo",
      header: "Photo",
      width: "4.5rem",
      cell: (temoignage) => {
        const media = temoignage.photoMediaId
          ? photos[temoignage.photoMediaId]
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
      key: "authorName",
      header: "Personne citée",
      sortable: true,
      sortValue: (temoignage) => temoignage.authorName,
      cell: (temoignage) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">
            {temoignage.authorName}
          </span>
          <span className="line-clamp-2 text-xs text-muted-foreground">
            « {temoignage.quote} »
          </span>
        </span>
      ),
    },
    {
      key: "authorRole",
      header: "Rôle",
      sortable: true,
      sortValue: (temoignage) => temoignage.authorRole,
      hideOnMobile: true,
      cell: (temoignage) => (
        <span className="truncate text-muted-foreground">
          {temoignage.authorRole}
        </span>
      ),
    },
    {
      key: "programmeId",
      header: "Programme",
      hideOnMobile: true,
      cell: (temoignage) => {
        if (!temoignage.programmeId) {
          // Invariant nº 1 : une absence est DITE, elle n'est pas une case vide.
          return <span className="text-muted-foreground">—</span>;
        }

        const titre = programmes[temoignage.programmeId];
        return titre ? (
          <span className="truncate text-muted-foreground">{titre}</span>
        ) : (
          /*
            Le témoignage pointe vers un programme que cet écran n'a pas pu
            lire — un brouillon devenu invisible, une lecture partielle. On ne
            fait pas passer ça pour « aucun programme ».
          */
          <span className="truncate text-muted-foreground italic">
            Programme non lisible
          </span>
        );
      },
    },
    {
      key: "hasConsent",
      header: "Accord",
      sortable: true,
      // Trier sur l'urgence, pas sur le booléen : les lignes à traiter en
      // premier sont celles qui sont EN LIGNE sans accord.
      sortValue: (temoignage) =>
        temoignage.hasConsent ? 2 : temoignage.status === "published" ? 0 : 1,
      cell: (temoignage) => {
        if (temoignage.hasConsent) {
          return (
            <span className="inline-flex items-center gap-1.5 text-muted-foreground">
              <ShieldCheck className="size-4 shrink-0" aria-hidden="true" />
              Accord obtenu
            </span>
          );
        }

        const enLigne = temoignage.status === "published";
        return (
          <span
            className={
              enLigne
                ? "inline-flex items-center gap-1.5 font-medium text-destructive"
                : "inline-flex items-center gap-1.5 text-muted-foreground"
            }
          >
            <ShieldAlert className="size-4 shrink-0" aria-hidden="true" />
            {enLigne ? "En ligne sans accord" : "Accord à obtenir"}
          </span>
        );
      },
    },
    {
      key: "status",
      header: "État",
      sortable: true,
      // Trier sur le RANG du cycle éditorial, pas sur le libellé : « À relire »
      // ne vient pas avant « Brouillon » dans le processus, seulement dans
      // l'alphabet.
      sortValue: (temoignage) => CONTENT_STATUSES.indexOf(temoignage.status),
      cell: (temoignage) => <StatusBadge status={temoignage.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Témoignages"
        description={`Les paroles recueillies auprès des bénéficiaires, bénévoles et partenaires. L'ordre ici est celui du site, et la page d'accueil n'affiche que les ${VISIBLES_SUR_ACCUEIL} premiers témoignages en ligne.`}
        actions={
          peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/temoignages/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouveau témoignage
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* L'état hérité, signalé plutôt que masqué                            */}
      {/* ------------------------------------------------------------------ */}
      {enLigneSansAccord.length > 0 ? (
        <div
          role="status"
          className="flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
        >
          <TriangleAlert
            className="mt-0.5 size-4 shrink-0 text-destructive"
            aria-hidden="true"
          />
          <p className="text-muted-foreground">
            <span className="font-medium text-foreground">
              {enLigneSansAccord.length === 1
                ? "Un témoignage est en ligne sans accord enregistré."
                : `${enLigneSansAccord.length} témoignages sont en ligne sans accord enregistré.`}
            </span>{" "}
            {enLigneSansAccord.length === 1 ? "Il date" : "Ils datent"} de la
            reprise du contenu du site : {enLigneSansAccord.length === 1
              ? "son texte est un gabarit"
              : "leurs textes sont des gabarits"}
            , pas une citation réelle.{" "}
            {enLigneSansAccord.length === 1 ? "Remplacez-le" : "Remplacez-les"}{" "}
            par de vraies paroles une fois l&apos;accord obtenu, ou{" "}
            {enLigneSansAccord.length === 1 ? "dépubliez-le" : "dépubliez-les"}.
            Aucun nouveau témoignage ne peut être mis en ligne sans accord.
          </p>
        </div>
      ) : null}

      <DataTable<Testimonial>
        data={temoignagesInitiaux}
        columns={colonnes}
        getRowId={(temoignage) => temoignage.id}
        primaryColumnKey="authorName"
        badgeColumnKey="status"
        itemLabel="témoignage"
        emptyState={{
          title: "Aucun témoignage pour l'instant",
          description:
            "Créez votre premier témoignage : il apparaîtra ici en brouillon, et ne sera visible sur le site qu'une fois l'accord de la personne obtenu et le témoignage publié.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/temoignages/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouveau témoignage
              </Link>
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher un témoignage…",
          keys: ["quote", "authorName", "authorRole"],
        }}
        filters={[
          {
            key: "status",
            label: "État",
            options: CONTENT_STATUSES.map((statut) => ({
              value: statut,
              label: CONTENT_STATUS_LABELS[statut],
            })),
            match: (temoignage, valeur) => temoignage.status === valeur,
          },
          {
            key: "hasConsent",
            label: "Accord",
            options: [
              { value: "oui", label: "Accord obtenu" },
              { value: "non", label: "Accord à obtenir" },
              { value: "alerte", label: "En ligne sans accord" },
            ],
            match: (temoignage, valeur) => {
              if (valeur === "oui") return temoignage.hasConsent;
              if (valeur === "non") return !temoignage.hasConsent;
              return !temoignage.hasConsent && temoignage.status === "published";
            },
          },
          {
            key: "programmeId",
            label: "Programme",
            options: [
              /*
                « Sans programme » est une option comme les autres : c'est un
                état réel, pas l'absence de filtre. Le §8B avait dû lui donner
                une sentinelle textuelle à cause de Radix ; ici la valeur
                transite dans le filtre du `<DataTable>`, qui est déjà une
                chaîne — il n'y a rien à contourner.
              */
              { value: "aucun", label: "Sans programme" },
              ...Object.entries(programmes).map(([id, titre]) => ({
                value: id,
                label: titre,
              })),
            ],
            match: (temoignage, valeur) =>
              valeur === "aucun"
                ? temoignage.programmeId === null
                : temoignage.programmeId === valeur,
          },
        ]}
        pagination={{ pageSize: 10 }}
        reorder={
          peutReordonner
            ? {
                onReorder: async (ordre) => {
                  const resultat = await reordonnerTemoignagesAction({
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
                    async (temoignage) => {
                      const resultat = await changerStatutTemoignageAction({
                        id: temoignage.id,
                        status: cible,
                      });
                      return resultat.ok;
                    },
                    (reussites, echecs) =>
                      echecs === 0
                        ? `${reussites} témoignage${reussites > 1 ? "s" : ""} ${cible === "published" ? "publié" : "dépublié"}${reussites > 1 ? "s" : ""}.`
                        : /*
                            Le motif le plus probable d'un refus en lot est
                            l'accord manquant. Il est nommé : « ouvrez les
                            fiches concernées » enverrait chercher une
                            information qu'on connaît déjà.
                          */
                          `${reussites} traité${reussites > 1 ? "s" : ""}, ${echecs} refusé${echecs > 1 ? "s" : ""} — le plus souvent parce que l'accord de la personne n'est pas enregistré. Filtrez sur « Accord à obtenir » pour les retrouver.`,
                  );
                },
              }
            : undefined
        }
        rowActions={(temoignage) => [
          {
            label: peutModifier ? "Modifier" : "Ouvrir la fiche",
            icon: Pencil,
            onSelect: () =>
              router.push(`/dashboard/temoignages/${temoignage.id}`),
          },
          ...(peutPublier
            ? [
                temoignage.status === "published"
                  ? {
                      label: "Dépublier",
                      icon: Undo2,
                      onSelect: () => void changerStatut(temoignage, "draft"),
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
                      disabled: !temoignage.hasConsent,
                      disabledReason:
                        "L'accord de la personne citée n'est pas enregistré.",
                      onSelect: () =>
                        void changerStatut(temoignage, "published"),
                    },
              ]
            : []),
          ...(peutSupprimer
            ? [
                {
                  label: "Supprimer",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(temoignage),
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
            ? `Supprimer le témoignage de ${aSupprimer.authorName} ?`
            : "Supprimer ce témoignage ?"
        }
        description="La citation disparaît du site et de la base. Cette action est définitive. Si ce témoignage était le seul à citer son programme, ce programme redevient supprimable."
        confirmLabel="Supprimer le témoignage"
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
            ? `Supprimer ${aSupprimerEnLot.length} témoignage${aSupprimerEnLot.length > 1 ? "s" : ""} ?`
            : "Supprimer ces témoignages ?"
        }
        description="Les citations disparaissent du site et de la base. Cette action est définitive."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const ids = aSupprimerEnLot ?? [];
          setASupprimerEnLot(null);

          await appliquerEnLot(
            ids,
            async (temoignage) => {
              const resultat = await supprimerTemoignageAction({
                id: temoignage.id,
              });
              return resultat.ok;
            },
            (reussites, echecs) =>
              echecs === 0
                ? `${reussites} témoignage${reussites > 1 ? "s" : ""} supprimé${reussites > 1 ? "s" : ""}.`
                : `${reussites} supprimé${reussites > 1 ? "s" : ""}, ${echecs} conservé${echecs > 1 ? "s" : ""}. Ouvrez les fiches concernées pour connaître le motif.`,
          );
        }}
      />
    </div>
  );
}
