import type { Metadata } from "next";

import { ArticleForm } from "@/components/dashboard/articles/article-form";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { listArticleCategories } from "@/core/use-cases/article-categories/manage-categories";
import { requirePermission } from "@/server/dal/session";
import { articleCategoryReadPort } from "@/server/deps/article.deps";

/**
 * /dashboard/actualites/nouveau — §8B.
 *
 * `article:create`, et non `article:update` : un éditeur crée et modifie, mais
 * la permission exigée doit être celle de l'action réelle. La Server Action
 * revérifie la même — c'est la deuxième barrière du §9 — et la RLS la
 * troisième.
 *
 * ---------------------------------------------------------------------------
 * UN ARTICLE NAÎT TOUJOURS EN BROUILLON
 * ---------------------------------------------------------------------------
 * Le cas d'usage l'impose (`status: input.status ?? 'draft'`) et l'écran le
 * DIT, plutôt que de laisser croire à une mise en ligne immédiate. Publier est
 * une décision distincte, prise depuis la fiche, avec une autre permission.
 *
 * ---------------------------------------------------------------------------
 * LES CATÉGORIES SONT LUES ICI, PAS DANS LE FORMULAIRE
 * ---------------------------------------------------------------------------
 * Écart nº 40 : les options d'un champ de choix sont fournies par l'écran. Un
 * champ qui va chercher ses options produirait un aller-retour après le rendu
 * et une liste déroulante vide en attendant.
 */
export const metadata: Metadata = {
  title: "Nouvel article",
};

export default async function NouvelArticlePage() {
  await requirePermission("article:create");

  // Un échec ne bloque pas la création : le champ « Catégorie » se rabat sur
  // « Sans catégorie » et le dit. Écrire un article sans pouvoir le classer
  // vaut mieux que de ne pas pouvoir l'écrire.
  const categories = await listArticleCategories(await articleCategoryReadPort());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nouvel article"
        description="L'article est enregistré en brouillon : il ne sera visible sur le site qu'une fois publié."
      />

      <ArticleForm categories={categories.ok ? categories.value : []} />
    </div>
  );
}
