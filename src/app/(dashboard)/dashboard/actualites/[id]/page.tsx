import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { ArticleEditeur } from "@/components/dashboard/articles/article-editeur";
import type { Article } from "@/core/cms/entities/article";
import { articleIdSchema } from "@/core/cms/schemas/article.schema";
import { can } from "@/core/rbac/policy";
import { listArticleCategories } from "@/core/use-cases/article-categories/manage-categories";
import { getArticleById } from "@/core/use-cases/articles/get-article";
import { requirePermission } from "@/server/dal/session";
import { articleCategoryReadPort, articleReadPort } from "@/server/deps/article.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/actualites/[id]
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL, donc de n'importe qui. Sans cette vérification,
 * `/dashboard/actualites/bonjour` produirait une erreur PostgREST 22P02
 * (« invalid input syntax for type uuid ») remontée en écran d'erreur
 * technique, là où la réponse juste est une 404 — la même que pour un article
 * réellement supprimé.
 *
 * ---------------------------------------------------------------------------
 * `params` EST UNE PROMESSE (Next.js 16, §15 du Rapport 1)
 * ---------------------------------------------------------------------------
 * `const { id } = await params`. La règle vaut aussi dans `generateMetadata`.
 */

/**
 * La lecture, mémoïsée sur la durée d'UN rendu.
 *
 * `generateMetadata` et la page demandent le même article : sans `cache()`,
 * chaque affichage produirait deux requêtes identiques.
 */
const lireArticle = cache(async (identifiant: string): Promise<Article | null> => {
  const analyse = articleIdSchema.safeParse({ id: identifiant });
  if (!analyse.success) return null;

  const resultat = await getArticleById(await articleReadPort(), analyse.data.id);

  if (resultat.ok) return resultat.value;
  // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
  // Toute autre erreur est une panne et doit remonter telle quelle.
  if (resultat.error.code === "NOT_FOUND") return null;
  throw resultat.error;
});

export async function generateMetadata(
  props: PageProps<"/dashboard/actualites/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait le nom d'un brouillon à un compte non
  // autorisé.
  await requirePermission("article:read");

  const article = await lireArticle(id);
  return { title: article ? article.title : "Article introuvable" };
}

export default async function ArticlePage(
  props: PageProps<"/dashboard/actualites/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("article:read");

  const article = await lireArticle(id);
  if (!article) notFound();

  const categories = await listArticleCategories(await articleCategoryReadPort());

  return (
    <ArticleEditeur
      article={article}
      categories={categories.ok ? categories.value : []}
      peutModifier={can(actor, "article:update")}
      peutPublier={can(actor, "article:publish")}
      peutSupprimer={can(actor, "article:delete")}
    />
  );
}
