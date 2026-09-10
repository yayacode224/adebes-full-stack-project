import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { SeoSettingsForm } from "@/components/dashboard/settings/seo-settings-form";
import { requirePermission } from "@/server/dal/session";
import { lireOuErreur } from "@/server/dal/safe-read";
import { settingsReadPort } from "@/server/deps/settings.deps";

export const metadata: Metadata = {
  title: "Référencement",
};

/** /dashboard/reglages/seo — écran « Référencement » (§10.1 du Rapport 2). */
export default async function ReglagesSeoPage() {
  await requirePermission("settings:read");

  const read = await settingsReadPort();
  const resultat = await lireOuErreur(() => read.getSeo());

  if (!resultat.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Référencement" />
        <ErrorState
          title="Les réglages de référencement n'ont pas pu être chargés"
          message={resultat.message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Référencement"
        description="Description et mots-clés par défaut, repris par les métadonnées de toutes les pages qui ne définissent pas les leurs."
      />
      <SeoSettingsForm reglages={resultat.value} />
    </div>
  );
}
