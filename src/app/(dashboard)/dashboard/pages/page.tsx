import type { Metadata } from "next";

import { PagesClient } from "@/components/dashboard/pages/pages-client";
import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { can } from "@/core/rbac/policy";
import {
  countSectionsByPage,
  listPages,
} from "@/core/use-cases/pages/list-pages";
import { requirePermission } from "@/server/dal/session";
import { pageReadPort } from "@/server/deps/page.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/pages
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §9.2 du Rapport 2. L'entrée de navigation existait depuis le Lot 5
 * (`dashboard-navigation.ts`, permission `page:read`) et menait jusqu'ici à une
 * 404 : ce lot lui donne sa destination.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository. »
 * Elle demande un port de LECTURE à `server/deps/`. Le nom
 * `SupabasePageRepository` n'apparaît nulle part ici.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * Lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope `'use cache'` ne
 * peut pas lire (§15, règle 10). Et elle ne doit surtout pas être mise en
 * cache — une page publiée il y a dix secondes doit apparaître avec son
 * nouvel état.
 */
export const metadata: Metadata = {
  title: "Pages",
};

/**
 * Toutes les pages.
 *
 * Douze aujourd'hui, quelques dizaines au pire : `<DataTable>` filtre, trie et
 * pagine en mémoire (§6.1). La borne existe malgré tout — `MAX_PAGE_SIZE` vaut
 * 100 — et c'est elle qui rendrait le problème visible si la collection
 * dérivait un jour.
 */
const TAILLE_PAGE = 100;

export default async function PagesPage() {
  const actor = await requirePermission("page:read");

  const read = await pageReadPort();

  const pages = await listPages(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "route",
    sortDirection: "asc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a aucune
    page » et « on n'a pas pu les lire » ne sont pas la même information, et les
    confondre est exactement ce que l'invariant nº 1 interdit. Le second appelle
    « Réessayer », le premier « Créer ».
  */
  if (!pages.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Pages"
          description="Les pages du site et leurs sections."
        />
        <ErrorState
          title="La liste des pages n'a pas pu être chargée"
          message={pages.error.message}
        />
      </div>
    );
  }

  /*
    Le nombre de sections vient d'une requête d'agrégat, pas d'une lecture des
    sections page par page : douze pages auraient produit treize requêtes pour
    afficher une colonne de nombres.

    ⚠️  Un échec ici ne fait PAS échouer l'écran. La colonne « Sections »
    est une information de confort ; la liste des pages, elle, est le contenu.
    Perdre la seconde à cause de la première serait disproportionné — la colonne
    affiche alors « — », ce que `<PagesClient>` sait rendre.
  */
  const sections = await countSectionsByPage(read);

  return (
    <PagesClient
      pages={pages.value}
      nombreDeSections={
        sections.ok ? Object.fromEntries(sections.value) : null
      }
      peutCreer={can(actor, "page:create")}
      peutModifier={can(actor, "page:update")}
      peutSupprimer={can(actor, "page:delete")}
      peutPublier={can(actor, "page:publish")}
    />
  );
}
