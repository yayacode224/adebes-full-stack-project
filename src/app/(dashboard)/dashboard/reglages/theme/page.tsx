import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { ThemeSettingsForm } from "@/components/dashboard/settings/theme-settings-form";
import { lireOuErreur } from "@/server/dal/safe-read";
import { requirePermission } from "@/server/dal/session";
import { settingsReadPort } from "@/server/deps/settings.deps";

export const metadata: Metadata = {
  title: "Thème",
};

/**
 * /dashboard/reglages/theme — écran « Thème » (§11 du Rapport 2).
 *
 * `theme:read` — accordée à `super_admin` et `admin` seulement, comme
 * `settings:read` et `navigation:read` (`core/rbac/permissions.ts`). La page
 * lit le groupe `theme` par le port de lecture ; la ligne du seed vaut `{}`,
 * le mappeur y fusionne alors `THEME_DEFAULTS` (copie de `globals.css`).
 */
export default async function ReglagesThemePage() {
  await requirePermission("theme:read");

  const read = await settingsReadPort();
  const resultat = await lireOuErreur(() => read.getTheme());

  if (!resultat.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Thème" />
        <ErrorState
          title="Le thème n'a pas pu être chargé"
          message={resultat.message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Thème"
        description="Couleurs, arrondis et polices du site public. Le contraste des textes est vérifié en direct ; l'enregistrement est bloqué s'il descend sous le minimum d'accessibilité."
      />
      <ThemeSettingsForm reglages={resultat.value} />
    </div>
  );
}
