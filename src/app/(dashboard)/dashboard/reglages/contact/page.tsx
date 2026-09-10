import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { ContactSettingsForm } from "@/components/dashboard/settings/contact-settings-form";
import { requirePermission } from "@/server/dal/session";
import { lireOuErreur } from "@/server/dal/safe-read";
import { settingsReadPort } from "@/server/deps/settings.deps";

export const metadata: Metadata = {
  title: "Contact",
};

/** /dashboard/reglages/contact — écran « Contact » (§10.1 du Rapport 2). */
export default async function ReglagesContactPage() {
  await requirePermission("settings:read");

  const read = await settingsReadPort();
  const resultat = await lireOuErreur(() => read.getContact());

  if (!resultat.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Contact" />
        <ErrorState
          title="Les coordonnées n'ont pas pu être chargées"
          message={resultat.message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Contact"
        description="Adresse, téléphone, e-mail, horaires et coordonnées GPS de l'association — affichés sur /contact, dans le pied de page et dans la barre d'action mobile."
      />
      <ContactSettingsForm reglages={resultat.value} />
    </div>
  );
}
