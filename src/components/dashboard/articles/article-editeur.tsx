"use client";

import { ArrowUpFromLine, CalendarClock, ExternalLink, Trash2, Undo2 } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import type { Article, ArticleCategory } from "@/core/cms/entities/article";
import type { ContentStatus } from "@/core/cms/entities/content-status";
import { estAVenir, formatDate } from "@/lib/dates";
import {
  changerStatutArticleAction,
  supprimerArticleAction,
} from "@/server/actions/articles.actions";

import { StatusBadge } from "../feedback/status-badge";
import { PageHeader } from "../layout/page-header";
import { ConfirmDialog } from "../modals/confirm-dialog";
import { ArticleForm } from "./article-form";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'ÉCRAN `/dashboard/actualites/[id]`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le formulaire, et autour de lui les décisions qui ne sont pas de la saisie :
 * publier, dépublier, supprimer, aller voir le résultat.
 *
 * ---------------------------------------------------------------------------
 * PUBLIER N'EST PAS ENREGISTRER
 * ---------------------------------------------------------------------------
 * Deux permissions distinctes (`article:update` et `article:publish`), deux cas
 * d'usage distincts, donc deux commandes distinctes à l'écran. Un bouton
 * « Enregistrer et publier » aurait fait publier un éditeur par mégarde — ou
 * plutôt le lui aurait fait tenter, puisque la base l'aurait refusé (trigger
 * `articles_guard_publish`, ADB01) après lui avoir laissé croire le contraire.
 *
 * ---------------------------------------------------------------------------
 * TROIS ÉTATS, PAS DEUX — LA SPÉCIFICITÉ DE CE LOT
 * ---------------------------------------------------------------------------
 * Un programme est en ligne ou ne l'est pas. Un article a un troisième état :
 * **publié mais pas encore visible**, parce que sa date est dans le futur. La
 * RLS le filtre (`published_at <= now()`, écart nº 12) et c'est le comportement
 * voulu — mais l'écran doit le DIRE, faute de quoi l'utilisateur cherche son
 * article sur le site et conclut à une panne. C'est le troisième point
 * d'attention du §8B, et il est traité en trois endroits : ici, dans la liste,
 * et dans le message de confirmation de la publication.
 */
export function ArticleEditeur({
  article,
  categories,
  peutModifier,
  peutPublier,
  peutSupprimer,
}: {
  article: Article;
  categories: ArticleCategory[];
  peutModifier: boolean;
  peutPublier: boolean;
  peutSupprimer: boolean;
}) {
  const router = useRouter();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  const enLigne = article.status === "published";
  const programme = enLigne && estAVenir(article.publishedAt);
  /** Publié ET échu : la seule combinaison réellement visible du public. */
  const visible = enLigne && !programme;

  async function changerStatut(status: ContentStatus) {
    const resultat = await changerStatutArticleAction({ id: article.id, status });

    if (!resultat.ok) {
      toast.error(resultat.message, { duration: 8000 });
      return;
    }

    const datePrevue = resultat.data.publishedAt;

    if (status !== "published") {
      toast.success("L'article n'est plus visible sur le site.");
    } else if (datePrevue && estAVenir(datePrevue)) {
      toast.success(
        `Article programmé : il apparaîtra sur le site le ${formatDate(datePrevue)}.`,
        { duration: 10000 },
      );
    } else {
      toast.success("L'article est en ligne.");
    }

    router.refresh();
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={article.title}
        description={
          visible
            ? "Cet article est visible sur le site. Toute modification enregistrée y apparaît."
            : programme
              ? "Cet article est publié, mais sa date de parution n'est pas encore atteinte."
              : "Cet article n'est pas encore visible sur le site. Publiez-le quand il est prêt."
        }
        actions={
          <>
            {peutPublier ? (
              enLigne ? (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void changerStatut("draft")}
                >
                  <Undo2 className="size-4" aria-hidden="true" />
                  Dépublier
                </Button>
              ) : (
                <Button type="button" onClick={() => void changerStatut("published")}>
                  <ArrowUpFromLine className="size-4" aria-hidden="true" />
                  Publier
                </Button>
              )
            ) : null}

            {/*
              Le lien « Voir sur le site » n'apparaît que si la page RÉPOND.
              Sur un article programmé, elle renvoie une 404 : proposer le lien
              ferait passer un comportement voulu pour une erreur.
            */}
            {visible ? (
              <Button asChild variant="outline">
                <a
                  href={`/actualites/${article.slug}`}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <ExternalLink className="size-4" aria-hidden="true" />
                  Voir sur le site
                </a>
              </Button>
            ) : null}

            {peutSupprimer ? (
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmationOuverte(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Supprimer
              </Button>
            ) : null}
          </>
        }
      />

      <div className="flex flex-wrap items-center gap-3">
        <StatusBadge status={article.status} />

        {programme && article.publishedAt ? (
          <p className="inline-flex items-center gap-1.5 text-sm font-medium text-foreground">
            <CalendarClock className="size-4 shrink-0" aria-hidden="true" />
            En ligne le {formatDate(article.publishedAt)}
          </p>
        ) : null}

        {!peutPublier ? (
          /*
            Dire POURQUOI le bouton n'est pas là. Une commande absente sans
            explication passe pour une panne (§12 du Rapport 1).
          */
          <p className="text-sm text-muted-foreground">
            La mise en ligne est réservée aux administrateurs. Vos modifications
            sont enregistrées et leur seront soumises.
          </p>
        ) : null}
      </div>

      {peutModifier ? (
        <ArticleForm article={article} categories={categories} />
      ) : (
        <p className="rounded-lg border border-dashed border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
          Vous n&apos;avez pas les droits pour modifier cet article.{" "}
          <Link
            href="/dashboard/actualites"
            className="font-medium text-primary underline underline-offset-2"
          >
            Revenir à la liste
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={confirmationOuverte}
        onOpenChange={setConfirmationOuverte}
        title={`Supprimer « ${article.title} » ?`}
        description="L'article et sa page disparaissent du site. Cette action est définitive."
        confirmLabel="Supprimer l'article"
        onConfirm={async () => {
          const resultat = await supprimerArticleAction({ id: article.id });

          if (!resultat.ok) {
            toast.error(resultat.message, { duration: 10000 });
            return;
          }

          toast.success(`« ${article.title} » a été supprimé.`);
          router.push("/dashboard/actualites");
        }}
      />
    </div>
  );
}
