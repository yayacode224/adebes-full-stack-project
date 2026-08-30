import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { StatsClient } from "@/components/dashboard/stats/stats-client";
import { can } from "@/core/rbac/policy";
import { listStats } from "@/core/use-cases/stats/list-stats";
import { requirePermission } from "@/server/dal/session";
import { statReadPort } from "@/server/deps/stat.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/chiffres
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8G du Rapport 2, sur le gabarit du §8E. L'entrée de navigation existait
 * depuis le Lot 5 (`dashboard-navigation.ts`, permission `stat:read`) et menait
 * jusqu'ici à une 404 : ce lot lui donne sa destination.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc un port de
 * LECTURE à `server/deps/`. Le nom `SupabaseStatRepository` n'apparaît nulle
 * part ici.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire (§15, règle 10 du Rapport 1). Et elle ne doit
 * surtout pas être mise en cache — un chiffre corrigé il y a dix secondes doit
 * apparaître avec sa nouvelle valeur.
 */
export const metadata: Metadata = {
  title: "Chiffres clés",
};

/**
 * Tous les chiffres, masqués compris.
 *
 * La collection en compte quatre et n'a pas vocation à en compter cinquante :
 * `<DataTable>` filtre, trie et pagine en mémoire (§6.1). La borne existe
 * malgré tout — `MAX_PAGE_SIZE` vaut 100 — et c'est elle qui rendrait le
 * problème visible si la collection dérivait un jour.
 */
const TAILLE_PAGE = 100;

export default async function ChiffresPage() {
  const actor = await requirePermission("stat:read");

  const read = await statReadPort();
  const chiffres = await listStats(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "position",
    sortDirection: "asc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a aucun
    chiffre » et « on n'a pas pu les lire » ne sont pas la même information, et
    les confondre est exactement ce que l'invariant nº 1 interdit — sur la
    collection qui le porte. Le second appelle « Réessayer », le premier
    « Créer ».
  */
  if (!chiffres.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Chiffres clés"
          description="Les cartes chiffrées de l'accueil et de « Impact & transparence »."
        />
        <ErrorState
          title="La liste des chiffres n'a pas pu être chargée"
          message={chiffres.error.message}
        />
      </div>
    );
  }

  return (
    <StatsClient
      chiffres={chiffres.value.items}
      peutCreer={can(actor, "stat:create")}
      peutModifier={can(actor, "stat:update")}
      peutSupprimer={can(actor, "stat:delete")}
      peutReordonner={can(actor, "stat:reorder")}
    />
  );
}
