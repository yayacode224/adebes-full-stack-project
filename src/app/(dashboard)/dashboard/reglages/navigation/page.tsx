import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { NavigationClient } from "@/components/dashboard/settings/navigation-client";
import type { NavigationItem, NavigationMenu } from "@/core/cms/entities/navigation-item";
import { can } from "@/core/rbac/policy";
import { lireOuErreur } from "@/server/dal/safe-read";
import { requirePermission } from "@/server/dal/session";
import { navigationReadPort } from "@/server/deps/navigation.deps";

export const metadata: Metadata = {
  title: "Navigation",
};

/**
 * /dashboard/reglages/navigation — §10.1 du Rapport 2.
 *
 * Les quatre menus sont lus en parallèle : quatre petites requêtes plutôt
 * qu'une lecture de table entière suivie d'un regroupement en mémoire — la
 * même préférence que `NavigationReadPort.findByMenu()` (voir ce fichier)
 * pour ne pas enseigner par l'exemple qu'un filtre côté Node est le bon
 * défaut.
 */
export default async function ReglagesNavigationPage() {
  const acteur = await requirePermission("navigation:read");

  const read = await navigationReadPort();
  const resultat = await lireOuErreur(
    async (): Promise<Record<NavigationMenu, NavigationItem[]>> => {
      const [main, conversion, legal, footer] = await Promise.all([
        read.findByMenu("main"),
        read.findByMenu("conversion"),
        read.findByMenu("legal"),
        read.findByMenu("footer"),
      ]);
      return { main, conversion, legal, footer };
    },
  );

  if (!resultat.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader title="Navigation" />
        <ErrorState
          title="La navigation n'a pas pu être chargée"
          message={resultat.message}
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Navigation"
        description="Les liens de l'en-tête et du pied de page du site public, par menu."
      />
      <NavigationClient
        parMenu={resultat.value}
        peutCreer={can(acteur, "navigation:create")}
        peutModifier={can(acteur, "navigation:update")}
        peutSupprimer={can(acteur, "navigation:delete")}
        peutReordonner={can(acteur, "navigation:reorder")}
      />
    </div>
  );
}
