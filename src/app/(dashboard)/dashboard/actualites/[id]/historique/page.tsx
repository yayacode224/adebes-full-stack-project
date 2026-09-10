import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ArticleHistorique } from "@/components/dashboard/articles/article-historique";
import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { Button } from "@/components/ui/button";
import { articleIdSchema } from "@/core/cms/schemas/article.schema";
import { can } from "@/core/rbac/policy";
import { getArticleById } from "@/core/use-cases/articles/get-article";
import { listVersions } from "@/core/use-cases/versions/list-versions";
import { requirePermission } from "@/server/dal/session";
import { articleReadPort } from "@/server/deps/article.deps";
import { contentVersionReadPort } from "@/server/deps/content-version.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/actualites/[id]/historique — l'historique des versions (§12.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Liste des instantanés d'un article, comparaison champ par champ avec l'état
 * courant, restauration. L'identifiant vient de l'URL : il est validé avant
 * toute lecture, comme sur l'écran d'édition.
 */
export const metadata: Metadata = {
  title: "Historique des versions",
};

export default async function ArticleHistoriquePage(
  props: PageProps<"/dashboard/actualites/[id]/historique">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("article:read");

  const analyse = articleIdSchema.safeParse({ id });
  if (!analyse.success) notFound();

  const article = await getArticleById(await articleReadPort(), analyse.data.id);
  if (!article.ok) {
    if (article.error.code === "NOT_FOUND") notFound();
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Historique des versions" />
        <ErrorState
          title="L'article n'a pas pu être chargé"
          message={article.error.message}
        />
      </div>
    );
  }

  const versions = await listVersions(
    await contentVersionReadPort(),
    "article",
    analyse.data.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Historique — ${article.value.title}`}
        description="Un instantané est créé à chaque publication. Comparez avec l'état actuel, restaurez si besoin."
        actions={
          <Button asChild variant="outline">
            <Link href={`/dashboard/actualites/${article.value.id}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Retour à l&apos;article
            </Link>
          </Button>
        }
      />

      {versions.ok ? (
        <ArticleHistorique
          article={article.value}
          versions={versions.value}
          peutRestaurer={can(actor, "article:update")}
        />
      ) : (
        <ErrorState
          title="L'historique n'a pas pu être chargé"
          message={versions.error.message}
        />
      )}
    </div>
  );
}
