import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { IdentitySettingsForm } from "@/components/dashboard/settings/identity-settings-form";
import { requirePermission } from "@/server/dal/session";
import { lireOuErreur } from "@/server/dal/safe-read";
import { settingsReadPort } from "@/server/deps/settings.deps";

/**
 * /dashboard/reglages — écran « Identité » (§10.1 du Rapport 2).
 *
 * Racine du groupe : `/dashboard/reglages` EST l'écran d'identité, pas une
 * redirection vers lui. C'est le premier onglet de `<SettingsTabs>`, et lui
 * donner sa propre URL plutôt qu'un renvoi évite un aller-retour serveur à
 * chaque ouverture depuis la barre latérale.
 *
 * `settings:read` — accordée à `super_admin` et `admin` seulement. La page
 * n'appelle pas de dépôt directement : elle lit par le port exposé par
 * `server/deps/`, comme toutes les pages du dashboard depuis le Lot 8A.
 */
export const metadata: Metadata = {
  title: "Identité",
};

export default async function ReglagesIdentitePage() {
  await requirePermission("settings:read");

  const read = await settingsReadPort();
  const resultat = await lireOuErreur(() => read.getIdentity());

  if (!resultat.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Identité" />
        <ErrorState
          title="Les réglages d'identité n'ont pas pu être chargés"
          message={resultat.message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Identité"
        description="Nom, devise et description de l'association — repris dans le pied de page, les métadonnées et le balisage du site."
      />
      <IdentitySettingsForm reglages={resultat.value} />
    </div>
  );
}
