import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { ValuesClient } from "@/components/dashboard/values/values-client";
import { can } from "@/core/rbac/policy";
import { listCoreValues } from "@/core/use-cases/core-values/list-core-values";
import { requirePermission } from "@/server/dal/session";
import { coreValueReadPort } from "@/server/deps/core-value.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/valeurs
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8E du Rapport 2, sur le gabarit du §8A.3. L'entrée de navigation existait
 * depuis le Lot 5 (`dashboard-navigation.ts`, permission `value:read`) et menait
 * jusqu'ici à une 404 : ce lot lui donne sa destination.
 *
 * ⚠️  Cette entrée avait elle-même dû être AJOUTÉE au Lot 5 (écart nº 25) : le
 * §5.2 du Rapport 2 l'oubliait, exactement comme le §9 du Rapport 1 oubliait la
 * ressource `value` (écart nº 5). Sans ces deux corrections, l'écran livré
 * aujourd'hui serait inatteignable et sa permission invérifiable.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc un port de
 * LECTURE à `server/deps/`. Le nom `SupabaseCoreValueRepository` n'apparaît
 * nulle part ici.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire (§15, règle 10 du Rapport 1). Et elle ne doit
 * surtout pas être mise en cache — une valeur masquée il y a dix secondes doit
 * apparaître avec son nouvel état.
 */
export const metadata: Metadata = {
  title: "Valeurs",
};

/**
 * Toutes les valeurs, masquées comprises.
 *
 * La collection en compte quatre et n'a pas vocation à en compter cinquante :
 * `<DataTable>` filtre, trie et pagine en mémoire (§6.1). La borne existe
 * malgré tout — `MAX_PAGE_SIZE` vaut 100 — et c'est elle qui rendrait le
 * problème visible si la collection dérivait un jour.
 */
const TAILLE_PAGE = 100;

export default async function ValeursPage() {
  const actor = await requirePermission("value:read");

  const read = await coreValueReadPort();
  const valeurs = await listCoreValues(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "position",
    sortDirection: "asc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a aucune
    valeur » et « on n'a pas pu les lire » ne sont pas la même information, et
    les confondre est exactement ce que l'invariant nº 1 interdit. Le second
    appelle « Réessayer », le premier « Créer ».
  */
  if (!valeurs.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Valeurs"
          description="Les principes de l'association."
        />
        <ErrorState
          title="La liste des valeurs n'a pas pu être chargée"
          message={valeurs.error.message}
        />
      </div>
    );
  }

  return (
    <ValuesClient
      valeurs={valeurs.value.items}
      peutCreer={can(actor, "value:create")}
      peutModifier={can(actor, "value:update")}
      peutSupprimer={can(actor, "value:delete")}
      peutReordonner={can(actor, "value:reorder")}
    />
  );
}
