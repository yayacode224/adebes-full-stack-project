import type { Metadata } from "next";

import { FaqClient } from "@/components/dashboard/faq/faq-client";
import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { can } from "@/core/rbac/policy";
import { listFaqItems } from "@/core/use-cases/faq-items/list-faq-items";
import { requirePermission } from "@/server/dal/session";
import { faqItemReadPort } from "@/server/deps/faq-item.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/faq
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8F du Rapport 2, sur le gabarit du §8A.3. L'entrée de navigation existait
 * depuis le Lot 5 (`dashboard-navigation.ts`, permission `faq:read`) et menait
 * jusqu'ici à une 404 : ce lot lui donne sa destination.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc un port de
 * LECTURE à `server/deps/`. Le nom `SupabaseFaqItemRepository` n'apparaît nulle
 * part ici.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire (§15, règle 10 du Rapport 1). Et elle ne doit
 * surtout pas être mise en cache — une question publiée il y a dix secondes
 * doit apparaître avec son nouvel état.
 */
export const metadata: Metadata = {
  title: "Questions fréquentes",
};

/**
 * Toutes les questions, brouillons compris.
 *
 * La collection en compte sept et n'a pas vocation à en compter deux cents :
 * `<DataTable>` filtre, trie et pagine en mémoire (§6.1). La borne existe
 * malgré tout — `MAX_PAGE_SIZE` vaut 100 — et c'est elle qui rendrait le
 * problème visible si la collection dérivait un jour.
 */
const TAILLE_PAGE = 100;

export default async function FaqPage() {
  const actor = await requirePermission("faq:read");

  const read = await faqItemReadPort();
  const questions = await listFaqItems(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "position",
    sortDirection: "asc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a
    aucune question » et « on n'a pas pu les lire » ne sont pas la même
    information, et les confondre est exactement ce que l'invariant nº 1
    interdit. Le second appelle « Réessayer », le premier « Créer ».
  */
  if (!questions.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Questions fréquentes"
          description="Les questions posées par les visiteurs, et vos réponses."
        />
        <ErrorState
          title="La liste des questions n'a pas pu être chargée"
          message={questions.error.message}
        />
      </div>
    );
  }

  return (
    <FaqClient
      questions={questions.value.items}
      peutCreer={can(actor, "faq:create")}
      peutModifier={can(actor, "faq:update")}
      peutPublier={can(actor, "faq:publish")}
      peutSupprimer={can(actor, "faq:delete")}
      peutReordonner={can(actor, "faq:reorder")}
    />
  );
}
