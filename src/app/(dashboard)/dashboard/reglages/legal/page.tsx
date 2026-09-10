import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { LegalSettingsForm } from "@/components/dashboard/settings/legal-settings-form";
import { requirePermission } from "@/server/dal/session";
import { lireOuErreur } from "@/server/dal/safe-read";
import { settingsReadPort } from "@/server/deps/settings.deps";

export const metadata: Metadata = {
  title: "Mentions légales",
};

/** /dashboard/reglages/legal — écran « Mentions légales » (§10.1 du Rapport 2). */
export default async function ReglagesLegalPage() {
  await requirePermission("settings:read");

  const read = await settingsReadPort();
  const resultat = await lireOuErreur(() => read.getLegal());

  if (!resultat.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Mentions légales" />
        <ErrorState
          title="Les mentions légales n'ont pas pu être chargées"
          message={resultat.message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Mentions légales"
        description="Numéro d'enregistrement, autorité et hébergeur — affichés sur la page « Mentions légales » et dans la section Gouvernance de « Qui sommes-nous »."
      />
      <LegalSettingsForm reglages={resultat.value} />
    </div>
  );
}
