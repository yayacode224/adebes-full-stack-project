"use client";

import {
  ArrowUpFromLine,
  ExternalLink,
  ImageOff,
  Pencil,
  Plus,
  Tags,
  Trash2,
  Undo2,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import type { Article, ArticleCategory } from "@/core/cms/entities/article";
import {
  CONTENT_STATUSES,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "@/core/cms/entities/content-status";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { SANS_CATEGORIE } from "@/core/cms/schemas/article.schema";
import { estAVenir, formatDateCourte } from "@/lib/dates";
import {
  changerStatutArticleAction,
  supprimerArticleAction,
} from "@/server/actions/articles.actions";

import { DataTable } from "../data-table/data-table";
import type { Column } from "../data-table/types";
import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { MediaThumbnail } from "../media/media-thumbnail";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { CategoriesModal } from "./categories-modal";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/actualites`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8B du Rapport 2, transposition du §8A.3.
 *
 * Colonnes : Couverture · Titre · Catégorie · Publié le · État · Actions.
 * Filtres : état, catégorie, exemples. Recherche : titre et chapô.
 * Actions groupées : publier, dépublier, supprimer.
 *
 * ---------------------------------------------------------------------------
 * PAS DE GLISSIÈRE DE RÉORDONNANCEMENT, CONTRAIREMENT AUX PROGRAMMES
 * ---------------------------------------------------------------------------
 * `articles` n'a pas de colonne `position` (migration 0005) : un fil
 * d'actualités s'ordonne par sa DATE. Proposer une poignée qui n'écrirait rien
 * — ou pire, appellerait `reorder_rows('articles')`, qui échoue faute de
 * colonne — aurait été une commande mensongère.
 *
 * Le réordonnancement de ce lot porte sur les CATÉGORIES, dans la modale
 * ouverte par « Gérer les catégories ».
 *
 * ---------------------------------------------------------------------------
 * DEUX INFORMATIONS QUE LE §8A N'AVAIT PAS À AFFICHER
 * ---------------------------------------------------------------------------
 *   * **« À venir »** — un article publié dont la date n'est pas échue est
 *     invisible du public. Sans mention, l'utilisateur voit « En ligne » et
 *     conclut à une panne en ne le trouvant pas sur le site (§8B, troisième
 *     point d'attention).
 *   * **« Exemple »** — `is_placeholder`. Le badge existe déjà sur le site
 *     public ; le dashboard doit permettre de repérer d'un coup d'œil ce qui
 *     reste à remplacer par du contenu réel.
 *
 * ---------------------------------------------------------------------------
 * LES PERMISSIONS SONT CALCULÉES SUR LE SERVEUR ET REÇUES EN PROPS
 * ---------------------------------------------------------------------------
 * Un bouton « Publier » rendu puis refusé au clic est une promesse non tenue.
 * Les Server Actions revérifient de toute façon, et la RLS est la troisième
 * barrière : masquer un bouton est du confort, pas une sécurité.
 */
export function ArticlesClient({
  articles: articlesInitiaux,
  categories,
  couvertures,
  total,
  peutCreer,
  peutModifier,
  peutPublier,
  peutSupprimer,
  peutReordonnerCategories,
}: {
  articles: Article[];
  categories: ArticleCategory[];
  /** Couvertures déjà résolues côté serveur, indexées par identifiant. */
  couvertures: Record<string, MediaAsset>;
  /** Nombre total d'articles en base — voir la note sur la borne, plus bas. */
  total: number;
  peutCreer: boolean;
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
  peutReordonnerCategories: boolean;
}) {
  const router = useRouter();

  const [aSupprimer, setASupprimer] = useState<Article | null>(null);
  const [aSupprimerEnLot, setASupprimerEnLot] = useState<string[] | null>(null);
  const [categoriesOuvertes, setCategoriesOuvertes] = useState(false);

  const libelleCategorie = new Map(
    categories.map((categorie) => [categorie.id, categorie.label]),
  );

  /* ---------------------------------------------------------------------- */
  /* Mutations                                                               */
  /* ---------------------------------------------------------------------- */

  async function changerStatut(article: Article, status: ContentStatus) {
    const resultat = await changerStatutArticleAction({ id: article.id, status });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    const datePrevue = resultat.data.publishedAt;

    if (status !== "published") {
      toast.success(`« ${article.title} » n'est plus visible sur le site.`);
    } else if (datePrevue && estAVenir(datePrevue)) {
      /*
        Publié, mais daté du futur. Le dire ICI est la moitié utile du §8B :
        l'utilisateur vient de cliquer « Publier », il va aller vérifier sur le
        site, et il ne trouvera rien.
      */
      toast.success(
        `« ${article.title} » est programmé pour le ${formatDateCourte(datePrevue)}. Il n'apparaîtra sur le site qu'à cette date.`,
        { duration: 10000 },
      );
    } else {
      toast.success(`« ${article.title} » est en ligne.`);
    }

    router.refresh();
  }

  async function supprimer(article: Article) {
    const resultat = await supprimerArticleAction({ id: article.id });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 10000 });
      return;
    }

    toast.success(`« ${article.title} » a été supprimé.`);
    router.refresh();
  }

  /**
   * Actions groupées, séquentielles et non parallèles.
   *
   * Chaque publication écrit une date et une entrée d'audit ; les lancer de
   * front rendrait l'ordre du journal non déterministe et compliquerait la
   * lecture d'un échec partiel.
   */
  async function appliquerEnLot(
    ids: string[],
    traiter: (article: Article) => Promise<boolean>,
    resume: (reussites: number, echecs: number) => string,
  ) {
    let reussites = 0;
    let echecs = 0;

    for (const id of ids) {
      const article = articlesInitiaux.find((a) => a.id === id);
      if (!article) continue;
      if (await traiter(article)) reussites += 1;
      else echecs += 1;
    }

    if (echecs === 0) toast.success(resume(reussites, echecs));
    else toast.error(resume(reussites, echecs), { duration: 10000 });

    router.refresh();
  }

  /* ---------------------------------------------------------------------- */
  /* Colonnes                                                                */
  /* ---------------------------------------------------------------------- */

  const colonnes: Column<Article>[] = [
    {
      key: "couverture",
      header: "Couverture",
      width: "5rem",
      cell: (article) => {
        const media = article.coverMediaId
          ? couvertures[article.coverMediaId]
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
      sortValue: (article) => article.title,
      cell: (article) => (
        <span className="flex min-w-0 flex-col">
          <span className="flex min-w-0 items-center gap-2">
            <span className="truncate font-medium text-foreground">
              {article.title}
            </span>
            {article.isPlaceholder ? (
              <Badge variant="outline" className="shrink-0 text-[0.7rem]">
                Exemple
              </Badge>
            ) : null}
          </span>
          <span className="line-clamp-1 text-xs text-muted-foreground">
            {article.excerpt}
          </span>
        </span>
      ),
    },
    {
      key: "categoryId",
      header: "Catégorie",
      sortable: true,
      sortValue: (article) =>
        (article.categoryId && libelleCategorie.get(article.categoryId)) ?? "",
      hideOnMobile: true,
      cell: (article) => {
        const label = article.categoryId
          ? libelleCategorie.get(article.categoryId)
          : undefined;

        // Un identifiant qui ne correspond à aucune catégorie connue est
        // traité comme une absence : jamais une pastille vide (invariant nº 2).
        return label ? (
          <Badge variant="secondary">{label}</Badge>
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        );
      },
    },
    {
      key: "publishedAt",
      header: "Publié le",
      align: "end",
      sortable: true,
      sortValue: (article) =>
        article.publishedAt ? new Date(article.publishedAt) : null,
      hideOnMobile: true,
      cell: (article) =>
        article.publishedAt ? (
          <span className="flex flex-col items-end">
            <time dateTime={article.publishedAt} className="text-muted-foreground">
              {formatDateCourte(article.publishedAt)}
            </time>
            {estAVenir(article.publishedAt) ? (
              <span className="text-xs font-medium text-foreground">À venir</span>
            ) : null}
          </span>
        ) : (
          // « — » et non une date inventée : l'invariant nº 1 vaut aussi pour
          // les dates. Un brouillon n'a pas de date de publication.
          <span className="text-muted-foreground">—</span>
        ),
    },
    {
      key: "status",
      header: "État",
      sortable: true,
      // Trier sur le RANG du cycle éditorial, pas sur le libellé.
      sortValue: (article) => CONTENT_STATUSES.indexOf(article.status),
      cell: (article) => <StatusBadge status={article.status} />,
    },
  ];

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Actualités"
        description="Les articles publiés sur le site, du plus récent au plus ancien."
        actions={
          <>
            {peutCreer ? (
              <Button asChild>
                <Link href="/dashboard/actualites/nouveau">
                  <Plus className="size-4" aria-hidden="true" />
                  Nouvel article
                </Link>
              </Button>
            ) : null}

            {peutModifier ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setCategoriesOuvertes(true)}
              >
                <Tags className="size-4" aria-hidden="true" />
                Gérer les catégories
              </Button>
            ) : null}
          </>
        }
      />

      {/*
        La liste est bornée à 100 lignes (voir la page). Tant que le total tient
        dessous, le filtrage en mémoire du `<DataTable>` est exact ; au-delà, il
        porterait sur une tranche sans que rien ne le dise. On le dit.
      */}
      {total > articlesInitiaux.length ? (
        <p
          role="status"
          className="rounded-lg border border-border bg-muted/40 px-3 py-2.5 text-sm text-muted-foreground"
        >
          Les {articlesInitiaux.length} articles les plus récents sont affichés,
          sur {total} au total. La recherche et les filtres ne portent que sur
          cette sélection.
        </p>
      ) : null}

      <DataTable<Article>
        data={articlesInitiaux}
        columns={colonnes}
        getRowId={(article) => article.id}
        primaryColumnKey="title"
        badgeColumnKey="status"
        itemLabel="article"
        emptyState={{
          title: "Aucun article pour l'instant",
          description:
            "Créez votre premier article : il apparaîtra ici en brouillon, et ne sera visible sur le site qu'une fois publié.",
          action: peutCreer ? (
            <Button asChild>
              <Link href="/dashboard/actualites/nouveau">
                <Plus className="size-4" aria-hidden="true" />
                Nouvel article
              </Link>
            </Button>
          ) : undefined,
        }}
        search={{
          placeholder: "Rechercher un article…",
          keys: ["title", "excerpt"],
        }}
        filters={[
          {
            key: "status",
            label: "État",
            options: CONTENT_STATUSES.map((statut) => ({
              value: statut,
              label: CONTENT_STATUS_LABELS[statut],
            })),
            match: (article, valeur) => article.status === valeur,
          },
          {
            key: "categoryId",
            label: "Catégorie",
            options: [
              ...categories.map((categorie) => ({
                value: categorie.id,
                label: categorie.label,
              })),
              // Même sentinelle que le formulaire : « sans catégorie » est un
              // choix, pas l'absence de choix.
              { value: SANS_CATEGORIE, label: "Sans catégorie" },
            ],
            match: (article, valeur) =>
              valeur === SANS_CATEGORIE
                ? article.categoryId === null
                : article.categoryId === valeur,
          },
          {
            key: "isPlaceholder",
            label: "Contenu",
            options: [
              { value: "reel", label: "Articles réels" },
              { value: "exemple", label: "Exemples de mise en page" },
            ],
            match: (article, valeur) =>
              valeur === "exemple" ? article.isPlaceholder : !article.isPlaceholder,
          },
        ]}
        pagination={{ pageSize: 10 }}
        selection={
          peutPublier || peutSupprimer
            ? {
                actions: [
                  ...(peutPublier
                    ? [
                        { key: "publier", label: "Publier", icon: ArrowUpFromLine },
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
                    async (article) => {
                      const resultat = await changerStatutArticleAction({
                        id: article.id,
                        status: cible,
                      });
                      return resultat.ok;
                    },
                    (reussites, echecs) =>
                      echecs === 0
                        ? `${reussites} article${reussites > 1 ? "s" : ""} ${cible === "published" ? "publié" : "dépublié"}${reussites > 1 ? "s" : ""}.`
                        : `${reussites} traité${reussites > 1 ? "s" : ""}, ${echecs} refusé${echecs > 1 ? "s" : ""}. Ouvrez les fiches concernées pour connaître le motif.`,
                  );
                },
              }
            : undefined
        }
        rowActions={(article) => [
          {
            label: peutModifier ? "Modifier" : "Ouvrir la fiche",
            icon: Pencil,
            onSelect: () => router.push(`/dashboard/actualites/${article.id}`),
          },
          ...(article.status === "published" && !estAVenir(article.publishedAt)
            ? [
                {
                  label: "Voir sur le site",
                  icon: ExternalLink,
                  onSelect: () =>
                    window.open(
                      `/actualites/${article.slug}`,
                      "_blank",
                      "noopener,noreferrer",
                    ),
                },
              ]
            : []),
          ...(peutPublier
            ? [
                article.status === "published"
                  ? {
                      label: "Dépublier",
                      icon: Undo2,
                      onSelect: () => void changerStatut(article, "draft"),
                    }
                  : {
                      label: "Publier",
                      icon: ArrowUpFromLine,
                      onSelect: () => void changerStatut(article, "published"),
                    },
              ]
            : []),
          ...(peutSupprimer
            ? [
                {
                  label: "Supprimer",
                  icon: Trash2,
                  variant: "destructive" as const,
                  onSelect: () => setASupprimer(article),
                },
              ]
            : []),
        ]}
      />

      {/* ------------------------------------------------------------------ */}
      {/* Catégories                                                          */}
      {/* ------------------------------------------------------------------ */}
      {/*
        `key` dérivée du contenu — découverte nº 12 : « un effet ne recopie pas
        une prop dans un état ». La modale tient une liste locale pour que le
        glisser-déposer réponde à l'œil ; quand le rendu serveur revient avec
        des catégories différentes (celles qu'on vient d'écrire, ou celles d'un
        collègue), le composant est REMONTÉ et repart de la vérité serveur.

        Le découpage des droits ci-dessous vient de la RLS, pas d'un choix
        d'interface : renommer et réordonner sont ouverts au personnel, ajouter
        et supprimer sont réservés aux administrateurs (migration 0009). Voir
        l'en-tête de `article-categories.actions.ts` pour le détail des
        permissions applicatives correspondantes.
      */}
      <CategoriesModal
        key={categories.map((c) => `${c.id}:${c.label}`).join("|")}
        open={categoriesOuvertes}
        onOpenChange={setCategoriesOuvertes}
        categories={categories}
        peutCreer={peutPublier}
        peutRenommer={peutModifier}
        peutSupprimer={peutSupprimer}
        peutReordonner={peutReordonnerCategories}
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
          aSupprimer ? `Supprimer « ${aSupprimer.title} » ?` : "Supprimer cet article ?"
        }
        description="L'article et sa page disparaissent du site. Cette action est définitive."
        confirmLabel="Supprimer l'article"
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
            ? `Supprimer ${aSupprimerEnLot.length} article${aSupprimerEnLot.length > 1 ? "s" : ""} ?`
            : "Supprimer ces articles ?"
        }
        description="Leurs pages disparaissent du site. Cette action est définitive."
        confirmLabel="Supprimer"
        onConfirm={async () => {
          const ids = aSupprimerEnLot ?? [];
          setASupprimerEnLot(null);

          await appliquerEnLot(
            ids,
            async (article) => {
              const resultat = await supprimerArticleAction({ id: article.id });
              return resultat.ok;
            },
            (reussites, echecs) =>
              echecs === 0
                ? `${reussites} article${reussites > 1 ? "s" : ""} supprimé${reussites > 1 ? "s" : ""}.`
                : `${reussites} supprimé${reussites > 1 ? "s" : ""}, ${echecs} conservé${echecs > 1 ? "s" : ""}.`,
          );
        }}
      />
    </div>
  );
}
