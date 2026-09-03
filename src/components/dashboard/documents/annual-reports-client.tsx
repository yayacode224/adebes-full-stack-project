"use client";

import {
  ArrowUpFromLine,
  CalendarArrowDown,
  Copy,
  FileText,
  FileWarning,
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
  anneesEnDoublon,
  MENTION_AVEC_DOCUMENT,
  MENTION_SANS_DOCUMENT,
  ordreSuitLesAnnees,
  type AnnualReport,
} from "@/core/cms/entities/annual-report";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "@/core/cms/entities/content-status";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { formaterPoids } from "@/lib/media-url";
import {
  changerStatutRapportAnnuelAction,
  reordonnerRapportsAnnuelsAction,
  supprimerRapportAnnuelAction,
} from "@/server/actions/annual-reports.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/documents`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8I du Rapport 2, transposition du gabarit du §8A.3 : glissière de
 * réordonnancement · Année · Titre · Document · État · Actions. Filtres : état,
 * présence du PDF. Actions groupées : publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * DEUX CHOSES QUE CET ÉCRAN DIT ET QU'AUCUN AUTRE N'AVAIT À DIRE
 * ---------------------------------------------------------------------------
 *
 * **1. Quels rapports sont en ligne SANS PDF.** C'est un état normal — c'est
 * même celui des deux rapports existants — mais c'est aussi le seul endroit
 * d'où l'on peut voir qu'il dure. Le bandeau les compte et rappelle ce que le
 * visiteur lit à leur place (« En cours de préparation »). Ce n'est PAS un
 * avertissement : le bandeau reste neutre tant qu'aucun défaut réel n'est
 * détecté.
 *
 * **2. Que l'ordre d'affichage ne suit pas les années.** `annual_reports` est
 * la seule collection du projet dont les lignes portent une donnée qui SUGGÈRE
 * un ordre. Un rapport créé aujourd'hui se place en fin de liste, quelle que
 * soit son année : le rapport 2026 se retrouverait après 2024. La règle vit
 * dans le domaine (`ordreSuitLesAnnees`) et l'écran la DIT, sans réordonner
 * tout seul — réordonner d'office écrirait des positions que personne n'a
 * demandées.
 *
 * ---------------------------------------------------------------------------
 * LA COLONNE « DOCUMENT » NE PEUT PAS SE CONTENTER DE `documentMediaId`
 * ---------------------------------------------------------------------------
 * Il y a TROIS états, pas deux : pas de PDF (normal), un PDF résolu (normal),
 * et une référence qui ne rend rien (défaut réel — lecture partielle, droits).
 * Les confondre ferait passer une panne pour un choix éditorial, ce qui est
 * exactement l'inverse de l'invariant nº 1.
 */

/**
 * Une ligne de l'écran : le rapport, plus ce que son document apporte.
 *
 * ⚠️  Les deux champs ajoutés ne sont PAS des champs de l'entité. Ils sont
 * calculés par la page à partir des médias résolus, et ils existent pour deux
 * raisons précises : rendre la recherche possible (`search.keys` porte sur les
 * clés de la ligne) et rendre le tri possible (`sortValue` a besoin d'une
 * valeur comparable). Même patron que `LigneGalerie` au Lot 8H.
 */
type LigneRapport = AnnualReport & {
  /** Le nom d'origine du fichier, ou une chaîne vide. */
  nomFichier: string;
  /** L'état du document, sous une forme triable et filtrable. */
  document: "absent" | "present" | "introuvable";
};

export function AnnualReportsClient({
  rapports,
  medias,
  total,
  peutCreer,
  peutModifier,
  peutPublier,
  peutSupprimer,
  peutReordonner,
}: {
  rapports: AnnualReport[];
  /** Documents déjà résolus côté serveur, indexés par identifiant de média. */
  medias: Record<string, MediaAsset>;
  /** Nombre total de rapports en base. */
  total: number;
  peutCreer: boolean;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<LigneRapport | null>(null);
  const [aSupprimerEnLot, setASupprimerEnLot] = useState<string[] | null>(null);

  const lignes: LigneRapport[] = rapports.map((rapport) => {
    const media = rapport.documentMediaId
      ? medias[rapport.documentMediaId]
      : undefined;

    return {
      ...rapport,
      nomFichier: media?.filename ?? "",
      document: !rapport.documentMediaId
        ? "absent"
        : media
          ? "present"
          : "introuvable",
    };
  });

  /* ---------------------------------------------------------------------- */
  /* Ce que le SITE montre — pas ce que ce tableau contient                  */
  /* ---------------------------------------------------------------------- */

  const publies = rapports.filter((rapport) => rapport.status === "published");

  const publiesSansDocument = publies.filter(
    (rapport) => rapport.documentMediaId === null,
  ).length;

  /*
    L'ordre est évalué sur la liste PUBLIÉE, pas sur le tableau entier.

    C'est ce que le visiteur voit : un brouillon 2019 rangé en tête ne dérange
    personne, il n'est pas sur le site. Mesurer sur tout aurait produit un
    avertissement pour un désordre invisible.
  */
  const ordreEnDesaccord = publies.length > 1 && !ordreSuitLesAnnees(publies);

  /** Les années présentes deux fois — la base l'interdit, on le vérifie. */
  const doublonsAnnee = anneesEnDoublon(rapports);

  /** Les documents employés par plus d'un rapport. */
  const doublonsFichier = new Set<string>();
  const vus = new Set<string>();
  for (const rapport of rapports) {
    if (!rapport.documentMediaId) continue;
    if (vus.has(rapport.documentMediaId)) {
      doublonsFichier.add(rapport.documentMediaId);
    } else {
      vus.add(rapport.documentMediaId);
    }
  }

  /** Les rapports dont le PDF référencé n'a pas pu être résolu. */
  const introuvables = lignes.filter(
    (ligne) => ligne.document === "introuvable",
  ).length;

  /** Y a-t-il un DÉFAUT, ou seulement des états normaux à rappeler ? */
  const enDefaut =
    introuvables > 0 || doublonsAnnee.length > 0 || doublonsFichier.size > 0;

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function changerStatut(ligne: LigneRapport, status: ContentStatus) {
    const resultat = await changerStatutRapportAnnuelAction({
      id: ligne.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? ligne.documentMediaId
          ? "Le rapport est en ligne, avec son PDF téléchargeable."
          : "Le rapport est en ligne, annoncé « En cours de préparation »."
        : "Le rapport n'est plus visible sur le site.",
    );
    router.refresh();
  }

  async function supprimer(ligne: LigneRapport) {
    const resultat = await supprimerRapportAnnuelAction({ id: ligne.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      "Le rapport a été supprimé. Le fichier reste dans la médiathèque.",
    );
    router.refresh();
  }

  /**
   * Actions groupées.
   *
   * Séquentielles et non parallèles : chaque suppression renumérote les
   * positions restantes (voir `deleteAnnualReport`), et deux renumérotations
   * concurrentes produiraient un ordre que personne n'a voulu.
   */
  async function appliquerEnLot(
    ids: string[],
    traiter: (ligne: LigneRapport) => Promise<boolean>,
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

  const colonnes: Column<LigneRapport>[] = [
    {
      key: "year",
      header: "Année",
      width: "6rem",
      sortable: true,
      sortValue: (ligne) => ligne.year,
      cell: (ligne) => (
        <span className="font-medium tabular-nums text-foreground">
          {ligne.year}
        </span>
      ),
    },
    {
      key: "title",
      header: "Titre",
      sortable: true,
      sortValue: (ligne) => ligne.title,
      cell: (ligne) => {
        const enDouble =
          ligne.documentMediaId !== null &&
          doublonsFichier.has(ligne.documentMediaId);

        return (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="line-clamp-2 font-medium text-foreground">
              {ligne.title}
            </span>

            {doublonsAnnee.includes(ligne.year) ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
                <Copy className="size-3.5 shrink-0" aria-hidden="true" />
                Deux rapports portent l&apos;année {ligne.year}
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
                Ce PDF est déjà rattaché à un autre rapport
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "document",
      header: "Document",
      sortable: true,
      // Trier sur un RANG choisi, pas sur l'ordre alphabétique des trois
      // libellés : « absent » viendrait avant « présent » par hasard, et
      // « introuvable » se glisserait entre les deux sans raison.
      sortValue: (ligne) =>
        ligne.document === "introuvable" ? 0 : ligne.document === "absent" ? 1 : 2,
      cell: (ligne) => {
        if (ligne.document === "introuvable") {
          return (
            <span className="flex min-w-0 items-center gap-1.5 text-destructive">
              <FileWarning className="size-4 shrink-0" aria-hidden="true" />
              <span className="text-sm font-medium">Fichier introuvable</span>
            </span>
          );
        }

        if (ligne.document === "absent") {
          return (
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="text-muted-foreground">Aucun PDF</span>
              <span className="text-xs text-muted-foreground">
                {MENTION_SANS_DOCUMENT.toLowerCase()} sur le site
              </span>
            </span>
          );
        }

        const media = medias[ligne.documentMediaId!]!;

        return (
          <span className="flex min-w-0 items-start gap-1.5">
            <FileText
              className="mt-0.5 size-4 shrink-0 text-muted-foreground"
              aria-hidden="true"
            />
            <span className="flex min-w-0 flex-col gap-0.5">
              <span className="truncate text-sm text-foreground">
                {media.filename}
              </span>
              <span className="text-xs text-muted-foreground">
                {formaterPoids(media.sizeBytes)}
              </span>
            </span>
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
      sortValue: (ligne) => CONTENT_STATUSES.indexOf(ligne.status),
      cell: (ligne) => <StatusBadge status={ligne.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Documents"
        description="Les rapports d'activité proposés au téléchargement sur la page Impact & transparence. Le PDF vient de la médiathèque ; un rapport sans fichier reste annoncé, sans lien."
        actions={
          peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/documents/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Ajouter un rapport
              </Link>
            </Button>
          ) : null
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Ce que le SITE montre — pas ce que ce tableau contient              */}
      {/* ------------------------------------------------------------------ */}
      {rapports.length > 0 ? (
        <div
          role="status"
          className={
            enDefaut
              ? "flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
              : "flex gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
          }
        >
          <TriangleAlert
            className={
              enDefaut
                ? "mt-0.5 size-4 shrink-0 text-destructive"
                : "mt-0.5 size-4 shrink-0 text-muted-foreground"
            }
            aria-hidden="true"
          />

          <div className="flex flex-col gap-2 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                {publies.length === 0
                  ? "Aucun rapport n'est en ligne."
                  : `${publies.length} rapport${publies.length > 1 ? "s" : ""} en ligne`}
              </span>{" "}
              {publies.length > 0 ? (
                <>
                  —{" "}
                  {publies.length - publiesSansDocument === 0
                    ? "aucun n'est téléchargeable"
                    : `${publies.length - publiesSansDocument} téléchargeable${publies.length - publiesSansDocument > 1 ? "s" : ""}`}
                  . La section « Rapports d&apos;activité » de la page Impact les
                  affiche tous.
                </>
              ) : (
                <>
                  La section « Rapports d&apos;activité » disparaît de la page
                  Impact plutôt que d&apos;annoncer un contenu absent.
                </>
              )}
            </p>

            {publiesSansDocument > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {publiesSansDocument === 1
                    ? "Un rapport en ligne n'a pas de PDF."
                    : `${publiesSansDocument} rapports en ligne n'ont pas de PDF.`}
                </span>{" "}
                {publiesSansDocument === 1 ? "Il est annoncé" : "Ils sont annoncés"}{" "}
                avec la mention « {MENTION_SANS_DOCUMENT} », sans bouton de
                téléchargement. C&apos;est un état normal — rattachez le fichier
                dès qu&apos;il est prêt.
              </p>
            ) : null}

            {ordreEnDesaccord ? (
              <p>
                <span className="font-medium text-foreground">
                  L&apos;ordre d&apos;affichage ne suit pas les années.
                </span>{" "}
                Les rapports en ligne apparaissent dans l&apos;ordre de cette
                liste, pas du plus récent au plus ancien. Faites glisser les
                lignes si ce n&apos;est pas voulu.
              </p>
            ) : null}

            {doublonsAnnee.length > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {doublonsAnnee.length === 1
                    ? `Deux rapports portent l'année ${doublonsAnnee[0]}.`
                    : `Plusieurs années portent deux rapports : ${doublonsAnnee.join(", ")}.`}
                </span>{" "}
                La base l&apos;interdit normalement : signalez-le, quelque chose
                s&apos;est écrit hors du dashboard.
              </p>
            ) : null}

            {doublonsFichier.size > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {doublonsFichier.size === 1
                    ? "Un même PDF est rattaché à deux rapports."
                    : `${doublonsFichier.size} PDF sont rattachés à deux rapports.`}
                </span>{" "}
                Deux années ne partagent pas un rapport d&apos;activité :
                vérifiez quel fichier va avec quelle année.
              </p>
            ) : null}

            {introuvables > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {introuvables === 1
                    ? "Le PDF d'un rapport n'a pas pu être chargé."
                    : `Les PDF de ${introuvables} rapports n'ont pas pu être chargés.`}
                </span>{" "}
                Le bouton de téléchargement n&apos;apparaîtra pas sur le site.
                Ouvrez le rapport concerné et choisissez un autre fichier.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      {/*
        La liste est bornée (voir la page). Tant que le total tient dessous, le
        filtrage en mémoire du `<DataTable>` est exact ; au-delà, il porterait
        sur une tranche sans que rien ne le dise. On le dit.

        ⚠️  C'est la collection du projet la moins susceptible d'y arriver — une
        association publie un rapport par an — mais la phrase coûte trois lignes
        et l'absence de garde coûte une recherche qui ment.
      */}
      {total > rapports.length ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
        >
          Les {rapports.length} premiers rapports sont affichés, sur {total} au
          total. La recherche et les filtres ne portent que sur cette sélection.
        </p>
      ) : null}

      <DataTable<LigneRapport>
        data={lignes}
        columns={colonnes}
        getRowId={(ligne) => ligne.id}
        primaryColumnKey="title"
        badgeColumnKey="status"
        itemLabel="rapport"
        emptyState={{
          title: "Aucun rapport d'activité",
          description:
            "Déclarez un rapport avec son année et son titre ; le PDF peut être rattaché plus tard. Tant qu'aucun rapport n'est publié, la section « Rapports d'activité » n'apparaît pas sur la page Impact.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/documents/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Ajouter un rapport
              </Link>
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher un rapport…",
          // `year` est un nombre ; `<DataTable>` le convertit en chaîne avant
          // de comparer, une saisie partielle (« 202 ») fonctionne donc ici,
          // là où le dépôt SQL ne sait faire qu'une égalité.
          keys: ["title", "year", "nomFichier"],
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
            key: "document",
            label: "Document",
            options: [
              { value: "present", label: MENTION_AVEC_DOCUMENT },
              { value: "absent", label: "Aucun PDF" },
              { value: "introuvable", label: "Fichier introuvable" },
            ],
            match: (ligne, valeur) => ligne.document === valeur,
          },
        ]}
        pagination={{ pageSize: 10 }}
        reorder={
          peutReordonner
            ? {
                onReorder: async (ordre) => {
                  const resultat = await reordonnerRapportsAnnuelsAction({
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
                    async (ligne) => {
                      const resultat = await changerStatutRapportAnnuelAction({
                        id: ligne.id,
                        status: cible,
                      });
                      return resultat.ok;
                    },
                    (reussites, echecs) =>
                      echecs === 0
                        ? `${reussites} rapport${reussites > 1 ? "s" : ""} ${cible === "published" ? "publié" : "dépublié"}${reussites > 1 ? "s" : ""}.`
                        : `${reussites} traité${reussites > 1 ? "s" : ""}, ${echecs} refusé${echecs > 1 ? "s" : ""} — ouvrez les rapports concernés pour connaître le motif.`,
                  );
                },
              }
            : undefined
        }
        rowActions={(ligne) => [
          {
            label: peutModifier ? "Modifier" : "Ouvrir le rapport",
            icon: Pencil,
            onSelect: () => router.push(`/dashboard/documents/${ligne.id}`),
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
                  label: "Supprimer le rapport",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(ligne),
                },
              ]
            : []),
        ]}
      />

      {/*
        Un rappel discret de la règle d'ordre, rendu SEULEMENT quand le
        réordonnancement est ouvert à ce compte. Le bandeau du haut ne parle que
        du désaccord ; celui-ci dit ce qu'on attend d'un ordre correct, ce
        qu'aucune colonne ne montre.
      */}
      {peutReordonner && rapports.length > 1 && !ordreEnDesaccord ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CalendarArrowDown className="size-4 shrink-0" aria-hidden="true" />
          Les rapports en ligne s&apos;affichent dans cet ordre, du plus récent
          au plus ancien.
        </p>
      ) : null}

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
            : "Supprimer ce rapport ?"
        }
        description="Le rapport disparaît de la page Impact et du dashboard. Le FICHIER PDF, lui, reste dans la médiathèque et peut être réutilisé — pour le supprimer définitivement, passez par la médiathèque. Pour retirer le rapport du site en le gardant ici, utilisez « Dépublier »."
        confirmLabel="Supprimer le rapport"
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
            ? `Supprimer ${aSupprimerEnLot.length} rapport${aSupprimerEnLot.length > 1 ? "s" : ""} ?`
            : "Supprimer ces rapports ?"
        }
        description="Les rapports disparaissent de la page Impact et du dashboard. Les FICHIERS PDF restent dans la médiathèque et peuvent être réutilisés."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const ids = aSupprimerEnLot ?? [];
          setASupprimerEnLot(null);

          await appliquerEnLot(
            ids,
            async (ligne) => {
              const resultat = await supprimerRapportAnnuelAction({
                id: ligne.id,
              });
              return resultat.ok;
            },
            (reussites, echecs) =>
              echecs === 0
                ? `${reussites} rapport${reussites > 1 ? "s" : ""} supprimé${reussites > 1 ? "s" : ""}.`
                : `${reussites} supprimé${reussites > 1 ? "s" : ""}, ${echecs} conservé${echecs > 1 ? "s" : ""}. Ouvrez les rapports concernés pour connaître le motif.`,
          );
        }}
      />
    </div>
  );
}
