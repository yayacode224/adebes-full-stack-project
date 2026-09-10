import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { SocialsSettingsForm } from "@/components/dashboard/settings/socials-settings-form";
import { requirePermission } from "@/server/dal/session";
import { lireOuErreur } from "@/server/dal/safe-read";
import { settingsReadPort } from "@/server/deps/settings.deps";

export const metadata: Metadata = {
  title: "Réseaux sociaux",
};

/** /dashboard/reglages/reseaux — écran « Réseaux sociaux » (§10.1 du Rapport 2). */
export default async function ReglagesReseauxPage() {
  await requirePermission("settings:read");

  const read = await settingsReadPort();
  const resultat = await lireOuErreur(() => read.getSocials());

  if (!resultat.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Réseaux sociaux" />
        <ErrorState
          title="Les réseaux sociaux n'ont pas pu être chargés"
          message={resultat.message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Réseaux sociaux"
        description="Un compte non créé apparaît grisé sur le site — jamais comme un lien mort."
      />
      <SocialsSettingsForm reglages={resultat.value} />
    </div>
  );
}
