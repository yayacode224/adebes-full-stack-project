import type { Metadata } from "next";

import { ArticlesClient } from "@/components/dashboard/articles/articles-client";
import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { can } from "@/core/rbac/policy";
import { listArticleCategories } from "@/core/use-cases/article-categories/manage-categories";
import { listArticles } from "@/core/use-cases/articles/list-articles";
import { getMediaByIds } from "@/core/use-cases/media/get-media";
import { requirePermission } from "@/server/dal/session";
import { articleCategoryReadPort, articleReadPort } from "@/server/deps/article.deps";
import { mediaReadPort } from "@/server/deps/media.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/actualites
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8B du Rapport 2.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc des ports
 * de LECTURE à `server/deps/`, et les passe aux cas d'usage. Le nom
 * `SupabaseArticleRepository` n'apparaît nulle part ici.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire. Et elle ne doit surtout pas être mise en
 * cache — un article publié il y a dix secondes doit apparaître avec son
 * nouvel état.
 */
export const metadata: Metadata = {
  title: "Actualités",
};

/**
 * Tous les articles, brouillons compris.
 *
 * ⚠️  BORNE ASSUMÉE, ET SIGNALÉE À L'ÉCRAN.
 *
 * `<DataTable>` filtre, trie et pagine en mémoire (§6.1, écart nº 51) : cela
 * suppose que la collection tienne dans une page. La collection en compte trois
 * aujourd'hui et grossira d'une poignée par an — mais elle grossira, ce qui la
 * distingue des huit programmes.
 *
 * Le choix retenu est donc celui du Lot 8A, avec un garde-fou en plus : la
 * borne est `MAX_PAGE_SIZE` (100), et l'écran AFFICHE le total quand il dépasse
 * ce qui est chargé. Une recherche qui ne trouve pas un article vieux de dix
 * ans doit s'expliquer, pas laisser croire qu'il a disparu.
 *
 * Le jour où le total approche la centaine, le filtrage passera côté serveur
 * comme celui de la médiathèque — le repository sait déjà le faire
 * (`findAll` accepte `search` et `status`).
 */
const TAILLE_PAGE = 100;

export default async function ActualitesPage() {
  const actor = await requirePermission("article:read");

  const read = await articleReadPort();
  const articles = await listArticles(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "publishedAt",
    sortDirection: "desc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a aucun
    article » et « on n'a pas pu les lire » ne sont pas la même information, et
    les confondre est exactement ce que l'invariant nº 1 interdit. Le second
    appelle « Réessayer », le premier « Créer ».
  */
  if (!articles.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Actualités"
          description="Les articles publiés sur le site."
        />
        <ErrorState
          title="La liste des articles n'a pas pu être chargée"
          message={articles.error.message}
        />
      </div>
    );
  }

  /*
    Les catégories alimentent une colonne, un filtre et la modale de gestion.
    Un échec ne justifie PAS d'écran d'erreur : la liste reste lisible sans
    elles — la colonne affiche « — » et le filtre disparaît. Même arbitrage que
    dans `articles.query.ts`, pour la même raison.
  */
  const categories = await listArticleCategories(await articleCategoryReadPort());

  /*
    Les couvertures sont résolues ICI, en une requête, et non par la colonne du
    tableau : N vignettes chargées une par une depuis le navigateur, ce serait
    N allers-retours après le rendu, et N cases vides en attendant.
  */
  const identifiants = articles.value.items
    .map((article) => article.coverMediaId)
    .filter((identifiant): identifiant is string => identifiant !== null);

  const medias = await getMediaByIds(await mediaReadPort(), identifiants);

  const couvertures: Record<string, MediaAsset> = {};
  if (medias.ok) {
    for (const media of medias.value) couvertures[media.id] = media;
  }

  return (
    <ArticlesClient
      articles={articles.value.items}
      categories={categories.ok ? categories.value : []}
      couvertures={couvertures}
      total={articles.value.total}
      peutCreer={can(actor, "article:create")}
      peutModifier={can(actor, "article:update")}
      peutPublier={can(actor, "article:publish")}
      peutSupprimer={can(actor, "article:delete")}
      peutReordonnerCategories={can(actor, "article:reorder")}
    />
  );
}
