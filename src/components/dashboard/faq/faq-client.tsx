"use client";

import {
  ArrowUpFromLine,
  Copy,
  Home,
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
  FAQ_ACCUEIL_MAX,
  FAQ_TOPICS,
  FAQ_TOPIC_LABELS,
  selectionAccueil,
  type FaqItem,
} from "@/core/cms/entities/faq-item";
import {
  changerStatutQuestionAction,
  reordonnerQuestionsAction,
  supprimerQuestionAction,
} from "@/server/actions/faq.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/faq`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8F du Rapport 2, transposition du gabarit du §8A.3 : glissière de
 * réordonnancement · Question · Sujet · Puces · État · Actions.
 * Filtres : état, sujet, puces. Recherche : question et réponse. Actions
 * groupées : publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * DEUX CHOSES QUE CET ÉCRAN DIT ET QU'AUCUN AUTRE N'AVAIT À DIRE
 * ---------------------------------------------------------------------------
 *
 * **1. Quelles questions atteignent l'accueil.** L'accueil n'affiche que les
 * quatre premières questions publiées, bénévolat exclu. Une question générale
 * en dixième position est donc publiée, valide, et invisible : elle n'a aucune
 * page à elle. C'est l'équivalent du témoignage publié hors des trois premiers
 * (Lot 8C), et la réponse est la même — le signaler, colonne par colonne,
 * plutôt que le laisser découvrir.
 *
 * **2. Les questions en double.** Deux questions identiques dans le même sujet
 * produisent deux entrées identiques dans le même JSON-LD `FAQPage` — une
 * déclaration incohérente envoyée aux moteurs, et deux panneaux jumeaux dans
 * l'accordéon. Ce n'est pas INTERDIT (ni la base ni le métier ne portent
 * d'unicité, et deux sujets différents peuvent légitimement poser la même
 * question), mais c'est signalé. Informer plutôt qu'interdire, quand l'état est
 * réversible d'un clic.
 */

/** Deux questions se ressemblent-elles au point de faire doublon ? */
function cleDeDoublon(question: FaqItem): string {
  return `${question.topic}::${question.question.trim().toLowerCase()}`;
}

export function FaqClient({
  questions: questionsInitiales,
  peutCreer,
  peutModifier,
  peutPublier,
  peutSupprimer,
  peutReordonner,
}: {
  questions: FaqItem[];
  peutCreer: boolean;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
  peutReordonner: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<FaqItem | null>(null);
  const [aSupprimerEnLot, setASupprimerEnLot] = useState<string[] | null>(null);

  /*
    Ce que le SITE montre, calculé une fois pour l'écran entier.

    `selectionAccueil` est la fonction du domaine, celle-là même qu'appelle la
    page d'accueil : recopier la règle ici l'aurait fait diverger le jour où la
    coupe change.

    Les publiées sont triées par position — c'est l'ordre du serveur, et le
    tableau ne l'a pas encore modifié : trier à nouveau ici masquerait une
    lecture qui renverrait un ordre faux.
  */
  const publiees = questionsInitiales.filter((q) => q.status === "published");
  const surAccueil = new Set(selectionAccueil(publiees).map((q) => q.id));

  const doublons = new Set<string>();
  const vues = new Set<string>();
  for (const question of questionsInitiales) {
    const cle = cleDeDoublon(question);
    if (vues.has(cle)) doublons.add(cle);
    else vues.add(cle);
  }

  const publieesParSujet = FAQ_TOPICS.map((topic) => ({
    topic,
    total: publiees.filter((q) => q.topic === topic).length,
  }));

  const sujetsVides = publieesParSujet.filter((entree) => entree.total === 0);

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function changerStatut(question: FaqItem, status: ContentStatus) {
    const resultat = await changerStatutQuestionAction({
      id: question.id,
      status,
    });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(
      status === "published"
        ? "La question est en ligne."
        : "La question n'est plus visible sur le site.",
    );
    router.refresh();
  }

  async function supprimer(question: FaqItem) {
    const resultat = await supprimerQuestionAction({ id: question.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success("La question a été supprimée.");
    router.refresh();
  }

  /**
   * Actions groupées.
   *
   * Séquentielles et non parallèles : chaque suppression renumérote les
   * positions restantes (voir `deleteFaqItem`), et deux renumérotations
   * concurrentes produiraient un ordre que personne n'a voulu.
   */
  async function appliquerEnLot(
    ids: string[],
    traiter: (question: FaqItem) => Promise<boolean>,
    resume: (reussites: number, echecs: number) => string,
  ) {
    let reussites = 0;
    let echecs = 0;

    for (const id of ids) {
      const question = questionsInitiales.find((q) => q.id === id);
      if (!question) continue;
      if (await traiter(question)) reussites += 1;
      else echecs += 1;
    }

    if (echecs === 0) toast.success(resume(reussites, echecs));
    else toast.error(resume(reussites, echecs), { duration: 10000 });

    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Colonnes                                                                */
  /* ---------------------------------------------------------------------- */

  const colonnes: Column<FaqItem>[] = [
    {
      key: "question",
      header: "Question",
      sortable: true,
      sortValue: (question) => question.question,
      cell: (question) => {
        const enDouble = doublons.has(cleDeDoublon(question));

        return (
          <span className="flex min-w-0 flex-col gap-0.5">
            <span className="truncate font-medium text-foreground">
              {question.question}
            </span>

            <span className="line-clamp-2 text-xs text-muted-foreground">
              {question.answer}
            </span>

            {/*
              Le motif est écrit en toutes lettres, pas seulement porté par une
              icône : une information rendue par la seule couleur ou la seule
              forme est invisible pour un lecteur d'écran.
            */}
            {enDouble ? (
              <span className="inline-flex items-center gap-1.5 text-xs text-destructive">
                <Copy className="size-3.5 shrink-0" aria-hidden="true" />
                Question en double dans ce sujet
              </span>
            ) : null}
          </span>
        );
      },
    },
    {
      key: "topic",
      header: "Sujet",
      sortable: true,
      sortValue: (question) => FAQ_TOPIC_LABELS[question.topic],
      cell: (question) => (
        <span className="text-muted-foreground">
          {FAQ_TOPIC_LABELS[question.topic]}
        </span>
      ),
    },
    {
      key: "bullets",
      header: "Puces",
      hideOnMobile: true,
      sortable: true,
      sortValue: (question) => question.bullets.length,
      cell: (question) =>
        question.bullets.length > 0 ? (
          <span className="text-muted-foreground">
            {question.bullets.length}
          </span>
        ) : (
          // Invariant nº 1 : une absence est DITE, elle n'est pas une case vide.
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "accueil",
      header: "Accueil",
      hideOnMobile: true,
      cell: (question) =>
        surAccueil.has(question.id) ? (
          <span className="inline-flex items-center gap-1.5 text-muted-foreground">
            <Home className="size-3.5 shrink-0" aria-hidden="true" />
            Affichée
          </span>
        ) : (
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
      sortValue: (question) => CONTENT_STATUSES.indexOf(question.status),
      cell: (question) => <StatusBadge status={question.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Questions fréquentes"
        description="Les questions posées par les visiteurs, et vos réponses. Chaque question s'affiche sur la page de son sujet, et les premières apparaissent aussi sur l'accueil."
        actions={
          peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/faq/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle question
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/* ------------------------------------------------------------------ */}
      {/* Ce que le SITE montre — pas ce que ce tableau contient              */}
      {/* ------------------------------------------------------------------ */}
      {questionsInitiales.length > 0 ? (
        <div
          role="status"
          className={
            doublons.size > 0 || sujetsVides.length > 0
              ? "flex gap-3 rounded-lg border border-destructive/40 bg-destructive/5 px-4 py-3 text-sm"
              : "flex gap-3 rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm"
          }
        >
          <TriangleAlert
            className={
              doublons.size > 0 || sujetsVides.length > 0
                ? "mt-0.5 size-4 shrink-0 text-destructive"
                : "mt-0.5 size-4 shrink-0 text-muted-foreground"
            }
            aria-hidden="true"
          />

          <div className="flex flex-col gap-2 text-muted-foreground">
            <p>
              <span className="font-medium text-foreground">
                {publiees.length === 0
                  ? "Aucune question n'est en ligne."
                  : `${publiees.length} question${publiees.length > 1 ? "s" : ""} en ligne`}
              </span>{" "}
              {publiees.length > 0 ? (
                <>
                  —{" "}
                  {publieesParSujet
                    .map(
                      (entree) =>
                        `${entree.total} sur « ${FAQ_TOPIC_LABELS[entree.topic]} »`,
                    )
                    .join(", ")}
                  . L&apos;accueil en affiche {surAccueil.size} : les{" "}
                  {FAQ_ACCUEIL_MAX} premières de la liste, bénévolat exclu.
                </>
              ) : (
                <>
                  Les sections « Questions fréquentes » disparaissent des trois
                  pages concernées plutôt que d&apos;annoncer un contenu absent.
                </>
              )}
            </p>

            {sujetsVides.length > 0 && publiees.length > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {sujetsVides.length === 1
                    ? `Le sujet « ${FAQ_TOPIC_LABELS[sujetsVides[0]!.topic]} » n'a aucune question en ligne.`
                    : `${sujetsVides.length} sujets n'ont aucune question en ligne.`}
                </span>{" "}
                La section « Questions fréquentes » de la page concernée
                n&apos;apparaît pas.
              </p>
            ) : null}

            {doublons.size > 0 ? (
              <p>
                <span className="font-medium text-foreground">
                  {doublons.size === 1
                    ? "Une question est posée deux fois dans le même sujet."
                    : `${doublons.size} questions sont posées deux fois dans le même sujet.`}
                </span>{" "}
                Les visiteurs verraient deux panneaux identiques, et les moteurs
                de recherche recevraient deux fois la même entrée. Modifiez
                l&apos;une des deux, ou supprimez-la.
              </p>
            ) : null}
          </div>
        </div>
      ) : null}

      <DataTable<FaqItem>
        data={questionsInitiales}
        columns={colonnes}
        getRowId={(question) => question.id}
        primaryColumnKey="question"
        badgeColumnKey="status"
        itemLabel="question"
        emptyState={{
          title: "Aucune question pour l'instant",
          description:
            "Créez votre première question : elle apparaîtra ici en brouillon, et ne sera visible sur le site qu'une fois publiée.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/faq/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle question
              </Link>
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher une question…",
          keys: ["question", "answer"],
        }}
        filters={[
          {
            key: "status",
            label: "État",
            options: CONTENT_STATUSES.map((statut) => ({
              value: statut,
              label: CONTENT_STATUS_LABELS[statut],
            })),
            match: (question, valeur) => question.status === valeur,
          },
          {
            key: "topic",
            label: "Sujet",
            options: FAQ_TOPICS.map((topic) => ({
              value: topic,
              label: FAQ_TOPIC_LABELS[topic],
            })),
            match: (question, valeur) => question.topic === valeur,
          },
          {
            key: "bullets",
            label: "Puces",
            options: [
              { value: "avec", label: "Avec puces" },
              { value: "sans", label: "Sans puces" },
            ],
            match: (question, valeur) =>
              valeur === "avec"
                ? question.bullets.length > 0
                : question.bullets.length === 0,
          },
        ]}
        pagination={{ pageSize: 10 }}
        reorder={
          peutReordonner
            ? {
                onReorder: async (ordre) => {
                  const resultat = await reordonnerQuestionsAction({
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
                    async (question) => {
                      const resultat = await changerStatutQuestionAction({
                        id: question.id,
                        status: cible,
                      });
                      return resultat.ok;
                    },
                    (reussites, echecs) =>
                      echecs === 0
                        ? `${reussites} question${reussites > 1 ? "s" : ""} ${cible === "published" ? "publiée" : "dépubliée"}${reussites > 1 ? "s" : ""}.`
                        : `${reussites} traitée${reussites > 1 ? "s" : ""}, ${echecs} refusée${echecs > 1 ? "s" : ""} — ouvrez les questions concernées pour connaître le motif.`,
                  );
                },
              }
            : undefined
        }
        rowActions={(question) => [
          {
            label: peutModifier ? "Modifier" : "Ouvrir la question",
            icon: Pencil,
            onSelect: () => router.push(`/dashboard/faq/${question.id}`),
          },
          ...(peutPublier
            ? [
                question.status === "published"
                  ? {
                      label: "Dépublier",
                      icon: Undo2,
                      onSelect: () => void changerStatut(question, "draft"),
                    }
                  : {
                      label: "Publier",
                      icon: ArrowUpFromLine,
                      onSelect: () => void changerStatut(question, "published"),
                    },
              ]
            : []),
          ...(peutSupprimer
            ? [
                {
                  label: "Supprimer",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(question),
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
            ? `Supprimer « ${aSupprimer.question} » ?`
            : "Supprimer cette question ?"
        }
        description="La question et sa réponse disparaissent du site et de la base. Cette action est définitive. Pour la retirer du site en gardant son texte, dépubliez-la."
        confirmLabel="Supprimer la question"
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
            ? `Supprimer ${aSupprimerEnLot.length} question${aSupprimerEnLot.length > 1 ? "s" : ""} ?`
            : "Supprimer ces questions ?"
        }
        description="Les questions et leurs réponses disparaissent du site et de la base. Cette action est définitive. Pour les retirer du site en gardant leur texte, dépubliez-les."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const ids = aSupprimerEnLot ?? [];
          setASupprimerEnLot(null);

          await appliquerEnLot(
            ids,
            async (question) => {
              const resultat = await supprimerQuestionAction({
                id: question.id,
              });
              return resultat.ok;
            },
            (reussites, echecs) =>
              echecs === 0
                ? `${reussites} question${reussites > 1 ? "s" : ""} supprimée${reussites > 1 ? "s" : ""}.`
                : `${reussites} supprimée${reussites > 1 ? "s" : ""}, ${echecs} conservée${echecs > 1 ? "s" : ""}. Ouvrez les questions concernées pour connaître le motif.`,
          );
        }}
      />
    </div>
  );
}
