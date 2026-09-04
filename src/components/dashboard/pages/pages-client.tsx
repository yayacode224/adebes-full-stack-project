"use client";

import { ExternalLink, Lock, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  CONTENT_STATUS_LABELS,
  CONTENT_STATUSES,
} from "@/core/cms/entities/content-status";
import type { Page } from "@/core/cms/entities/page";
import { formatDateCourte } from "@/lib/dates";
import { supprimerPageAction } from "@/server/actions/pages.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/pages`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §9.2 du Rapport 2 : Titre · Adresse · Sections · Statut · Modifié le, avec
 * `is_system` signalé.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CET ÉCRAN N'A NI RÉORDONNANCEMENT NI ACTIONS GROUPÉES
 * ---------------------------------------------------------------------------
 * C'est ce qui le distingue des neuf listes de la série 8, et les deux absences
 * sont des décisions :
 *
 *   * **pas de réordonnancement** — `pages` n'a pas de colonne `position`.
 *     L'ordre des pages du site est celui de la NAVIGATION (Lot 10), pas celui
 *     d'une liste. Une glissière ici aurait laissé croire le contraire ;
 *   * **pas d'actions groupées** — publier douze pages d'un clic, ou en
 *     supprimer plusieurs, n'est pas un geste qu'on veut rendre facile. Une
 *     page est une URL du site : elle se traite une par une.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE PAGE SYSTÈME EST SIGNALÉE, PAS GRISÉE
 * ---------------------------------------------------------------------------
 * Les douze pages du seed correspondent à un fichier de route sous
 * `src/app/(site)/`. Elles s'ÉDITENT normalement — c'est même le principal
 * intérêt de cet écran — mais elles ne se suppriment pas, et leur adresse est
 * verrouillée.
 *
 * L'entrée « Supprimer » n'est donc pas rendue pour elles, et le cadenas de la
 * colonne Adresse dit pourquoi. Une action présente mais désactivée aurait
 * laissé chercher la condition à remplir ; une action absente sans motif passe
 * pour une panne (§12 du Rapport 1).
 */

export function PagesClient({
  pages,
  nombreDeSections,
  peutCreer,
  peutModifier,
  peutSupprimer,
  peutPublier,
}: {
  pages: Page[];
  /**
   * Nombre de sections par identifiant de page, ou `null` si le comptage a
   * échoué.
   *
   * ⚠️  `null` et non un objet vide : « aucune section » et « on n'a pas pu
   * compter » ne sont pas la même information. La colonne affiche « — » dans
   * le second cas, `0` dans le premier.
   */
  nombreDeSections: Record<string, number> | null;
  peutCreer: boolean;
  peutModifier: boolean;
  peutSupprimer: boolean;
  peutPublier: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<Page | null>(null);

  const brouillons = pages.filter((page) => page.status !== "published");

  async function supprimer(page: Page) {
    const resultat = await supprimerPageAction({ id: page.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(`« ${resultat.data.title} » a été supprimée.`);
    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Colonnes                                                                */
  /* ---------------------------------------------------------------------- */

  const colonnes: Column<Page>[] = [
    {
      key: "title",
      header: "Titre",
      sortable: true,
      sortValue: (page) => page.title,
      cell: (page) => (
        <span className="flex min-w-0 flex-col">
          <span className="truncate font-medium text-foreground">
            {page.title}
          </span>
          {/*
            L'adresse en second, dans la colonne primaire : sous 768 px, la
            carte n'affiche que celle-ci, et deux pages peuvent porter des
            titres proches (« Contact » et « Contactez-nous »). C'est l'adresse
            qui les distingue.
          */}
          <span className="truncate font-mono text-xs text-muted-foreground">
            {page.route}
          </span>
        </span>
      ),
    },
    {
      key: "route",
      header: "Adresse",
      hideOnMobile: true,
      sortable: true,
      sortValue: (page) => page.route,
      cell: (page) => (
        <span className="flex items-center gap-2">
          <span className="truncate font-mono text-xs text-muted-foreground">
            {page.route}
          </span>
          {page.isSystem ? (
            <span
              className="inline-flex items-center gap-1 rounded-full border border-border px-2 py-0.5 text-[0.7rem] text-muted-foreground"
              title="Cette page fait partie de la structure du site : son adresse est verrouillée et elle ne peut pas être supprimée."
            >
              <Lock className="size-3" aria-hidden="true" />
              Structure
            </span>
          ) : null}
        </span>
      ),
    },
    {
      key: "sections",
      header: "Sections",
      hideOnMobile: true,
      align: "end",
      sortable: true,
      sortValue: (page) => nombreDeSections?.[page.id] ?? -1,
      cell: (page) => (
        <span className="text-muted-foreground">
          {nombreDeSections ? (nombreDeSections[page.id] ?? 0) : "—"}
        </span>
      ),
    },
    {
      key: "status",
      header: "Statut",
      sortable: true,
      // Les pages en ligne d'abord : c'est l'ordre utile, « qu'est-ce que le
      // site sert ».
      sortValue: (page) => (page.status === "published" ? 0 : 1),
      cell: (page) => <StatusBadge status={page.status} />,
    },
    {
      key: "updatedAt",
      header: "Modifié le",
      hideOnMobile: true,
      sortable: true,
      sortValue: (page) => page.updatedAt,
      cell: (page) => (
        <span className="text-muted-foreground">
          {formatDateCourte(page.updatedAt)}
        </span>
      ),
    },
  ];

  /* ---------------------------------------------------------------------- */
  /* Rendu                                                                   */
  /* ---------------------------------------------------------------------- */

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Pages"
        description="Les pages du site et les sections qui les composent. Ouvrez une page pour ajouter, remplir et réordonner ses sections."
        actions={
          peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/pages/nouvelle">
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle page
              </Link>
            </Button>
          ) : undefined
        }
      />

      {/*
        ⚠️  CE QUE LE SITE SERT, ET QUE LE TABLEAU NE DIT PAS TOUT SEUL.

        Un tableau de douze lignes laisse croire que le site a douze pages. Une
        page en brouillon existe ici et répond 404 là-bas — l'écart est le même
        que celui du bandeau des valeurs (Lot 8E), et il compte davantage :
        c'est une URL entière qui manque, pas une section.
      */}
      {brouillons.length > 0 ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground"
        >
          <span className="font-medium text-foreground">
            {brouillons.length === 1
              ? "Une page de cette liste n'est pas en ligne."
              : `${brouillons.length} pages de cette liste ne sont pas en ligne.`}
          </span>{" "}
          Leur contenu est modifiable ici, mais leur adresse ne répond pas aux
          visiteurs tant qu&apos;elles ne sont pas publiées.
        </p>
      ) : null}

      {!peutCreer ? (
        <p className="text-sm text-muted-foreground">
          Créer et supprimer une page est réservé aux administrateurs : une page
          est une adresse du site, et la retirer casse tous les liens qui y
          mènent. Vous pouvez modifier le contenu et les réglages de celles qui
          existent.
        </p>
      ) : null}

      <DataTable<Page>
        data={pages}
        columns={colonnes}
        getRowId={(page) => page.id}
        primaryColumnKey="title"
        badgeColumnKey="status"
        itemLabel="page"
        emptyState={{
          title: "Aucune page pour l'instant",
          description:
            "Une page est une adresse du site et la suite de sections qui la composent.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/pages/nouvelle">
                <Plus className="size-4" aria-hidden="true" />
                Nouvelle page
              </Link>
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher une page…",
          keys: ["title", "route"],
        }}
        filters={[
          {
            key: "status",
            label: "Statut",
            options: CONTENT_STATUSES.map((statut) => ({
              value: statut,
              label: CONTENT_STATUS_LABELS[statut],
            })),
            match: (page, choix) => page.status === choix,
          },
          {
            key: "isSystem",
            label: "Type",
            options: [
              { value: "system", label: "Structure du site" },
              { value: "libre", label: "Page ajoutée" },
            ],
            match: (page, choix) =>
              choix === "system" ? page.isSystem : !page.isSystem,
          },
        ]}
        pagination={{ pageSize: 20 }}
        rowActions={(page) => [
          {
            label: peutModifier ? "Ouvrir l'éditeur" : "Consulter",
            icon: Pencil,
            onSelect: () => router.push(`/dashboard/pages/${page.id}`),
          },
          /*
            « Voir sur le site » n'est proposé que si la page est PUBLIÉE :
            sinon le lien mène à une 404, c'est-à-dire un lien mort proposé par
            le dashboard lui-même (invariant nº 2).
          */
          ...(page.status === "published"
            ? [
                {
                  label: "Voir sur le site",
                  icon: ExternalLink,
                  onSelect: () => window.open(page.route, "_blank"),
                },
              ]
            : []),
          ...(peutSupprimer && !page.isSystem
            ? [
                {
                  label: "Supprimer",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(page),
                },
              ]
            : []),
        ]}
      />

      {/*
        ⚠️  Le nombre de sections perdues est ANNONCÉ, et la suppression est
        définitive tant que le Lot 12 n'a pas livré les versions de contenu.
        Dépublier est proposé comme alternative — c'est le geste réversible.
      */}
      <ConfirmDialog
        open={aSupprimer !== null}
        onOpenChange={(ouvert) => {
          if (!ouvert) setASupprimer(null);
        }}
        title={
          aSupprimer ? `Supprimer « ${aSupprimer.title} » ?` : "Supprimer ?"
        }
        description={
          aSupprimer
            ? `L'adresse ${aSupprimer.route} ne répondra plus, et ${sectionsDe(nombreDeSections, aSupprimer)} sera perdu. Cette suppression est définitive.${
                peutPublier
                  ? " Pour la retirer du site sans rien perdre, dépubliez-la depuis son éditeur."
                  : ""
              }`
            : ""
        }
        confirmLabel="Supprimer la page"
        variant="destructive"
        onConfirm={async () => {
          if (aSupprimer) await supprimer(aSupprimer);
          setASupprimer(null);
        }}
      />
    </div>
  );
}

/** « son contenu » quand le comptage a échoué, « ses N sections » sinon. */
function sectionsDe(
  compte: Record<string, number> | null,
  page: Page,
): string {
  const nombre = compte?.[page.id];
  if (nombre === undefined) return "tout son contenu";
  if (nombre === 0) return "son contenu";
  return nombre === 1 ? "sa section" : `ses ${nombre} sections`;
}
