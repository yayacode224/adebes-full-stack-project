import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { PageHistorique } from "@/components/dashboard/pages/page-historique";
import { Button } from "@/components/ui/button";
import { pageIdSchema } from "@/core/cms/schemas/page.schema";
import { can } from "@/core/rbac/policy";
import { getPage } from "@/core/use-cases/pages/get-page";
import { listVersions } from "@/core/use-cases/versions/list-versions";
import { requirePermission } from "@/server/dal/session";
import { contentVersionReadPort } from "@/server/deps/content-version.deps";
import { pageDeps } from "@/server/deps/page.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/pages/[id]/historique — l'historique des versions (§12.2)
 * ═══════════════════════════════════════════════════════════════════════════
 */
export const metadata: Metadata = {
  title: "Historique des versions",
};

export default async function PageHistoriquePage(
  props: PageProps<"/dashboard/pages/[id]/historique">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("page:read");

  const analyse = pageIdSchema.safeParse({ id });
  if (!analyse.success) notFound();

  const page = await getPage(await pageDeps(), analyse.data.id);
  if (!page.ok) {
    if (page.error.code === "NOT_FOUND") notFound();
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Historique des versions" />
        <ErrorState
          title="La page n'a pas pu être chargée"
          message={page.error.message}
        />
      </div>
    );
  }

  const versions = await listVersions(
    await contentVersionReadPort(),
    "page",
    analyse.data.id,
  );

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title={`Historique — ${page.value.title}`}
        description="Un instantané est créé à chaque publication. Comparez avec l'état actuel, restaurez si besoin."
        actions={
          <Button asChild variant="outline">
            <Link href={`/dashboard/pages/${page.value.id}`}>
              <ArrowLeft className="size-4" aria-hidden="true" />
              Retour à la page
            </Link>
          </Button>
        }
      />

      {versions.ok ? (
        <PageHistorique
          page={page.value}
          sectionsCount={page.value.sections.length}
          versions={versions.value}
          peutRestaurer={can(actor, "page:update")}
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
