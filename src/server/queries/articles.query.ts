import "server-only";

import { cache } from "react";

import type { Article, ArticleCategory } from "@/core/cms/entities/article";
import type {
  ArticleCategoryReadPort,
  ArticleReadPort,
} from "@/core/cms/ports/article.port";
import { getPublishedArticleBySlug } from "@/core/use-cases/articles/get-article";
import { listPublishedArticles } from "@/core/use-cases/articles/list-articles";
import { listArticleCategories } from "@/core/use-cases/article-categories/manage-categories";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseArticleCategoryRepository } from "@/infrastructure/supabase/repositories/article-category.repository";
import { SupabaseArticleRepository } from "@/infrastructure/supabase/repositories/article.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DES ACTUALITÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * C'est la seule porte par laquelle le site public lit les articles : aucune
 * page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Même situation qu'au Lot 8A, et le raisonnement complet est dans l'en-tête de
 * `programmes.query.ts` : la directive `'use cache'` est une fonctionnalité de
 * Cache Components, et `cacheComponents: true` est explicitement repoussé au
 * Lot 15 par le §0.4 du Rapport 2. Les pages concernées portent donc
 * `export const dynamic = "force-dynamic"`.
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI**, et rien d'autre :
 *
 *   1. `'use cache'` en première ligne de chaque fonction exportée ;
 *   2. `cacheTag(...)` avec les étiquettes déjà nommées ci-dessous, puis
 *      `cacheLife('days')` ;
 *   3. retirer les `export const dynamic` des pages de `src/app/(site)/`.
 *
 * ⚠️  UN POINT PROPRE À CE LOT, À NE PAS OUBLIER AU LOT 15 : la fiche d'un
 * article affiche le LIBELLÉ de sa catégorie. Sa mise en cache doit donc porter
 * `ETIQUETTE_CATEGORIES` **en plus** de son étiquette de fiche, faute de quoi
 * renommer une catégorie laisserait l'ancien libellé sur toutes les pages
 * d'article. C'est la contrepartie assumée du choix inverse — les actions de
 * catégorie ne peuvent pas énumérer les fiches concernées sans lire toute la
 * collection (voir `article-categories.actions.ts`).
 *
 * ---------------------------------------------------------------------------
 * `createPublicClient()`, JAMAIS `createServerClient()`
 * ---------------------------------------------------------------------------
 * Une règle ESLint interdit l'import de `clients/server` dans ce dossier, et
 * elle vaut aussi par ricochet : ce fichier compose son propre dépôt au lieu de
 * passer par `server/deps/article.deps.ts`, qui importe `next/headers`.
 *
 * Le client anonyme ne voit que le contenu publié ET échu (RLS
 * `articles_public_read`, écart nº 12). Le filtrage est malgré tout répété dans
 * le dépôt : deux barrières indépendantes.
 */

/** Étiquette de la collection entière. */
export const ETIQUETTE_ARTICLES = "cms:articles";

/** Étiquette des catégories — voir l'avertissement ci-dessus. */
export const ETIQUETTE_CATEGORIES = "cms:article-categories";

/** Étiquette d'une fiche — `cms:article:exemple-rentree-scolaire-solidaire`. */
export function etiquetteArticle(slug: string): string {
  return `cms:article:${slug}`;
}

function portPublic(): ArticleReadPort {
  return new SupabaseArticleRepository(createPublicClient());
}

function portCategoriesPublic(): ArticleCategoryReadPort {
  return new SupabaseArticleCategoryRepository(createPublicClient());
}

/**
 * Les articles publiés, du plus récent au plus ancien.
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu. C'est ce qui permet à
 * `generateMetadata` et à la page de partager une seule requête, et à la page
 * d'un article de lire la liste (« À lire également ») sans la redemander.
 *
 * ⚠️  Ce n'est PAS un cache entre requêtes — il ne remplace pas `'use cache'`.
 */
export const getArticlesPublies = cache(async (): Promise<Article[]> => {
  const resultat = await listPublishedArticles(portPublic());

  /*
    Une lecture en échec LÈVE plutôt que de renvoyer une liste vide.

    « Il n'y a aucun article » et « on n'a pas pu les lire » ne sont pas la même
    information, et les confondre afficherait au visiteur une association
    silencieuse — c'est l'invariant nº 1 à l'échelle d'une page.
  */
  if (!resultat.ok) throw resultat.error;
  return resultat.value;
});

/**
 * Un article publié, par son adresse. `null` si l'adresse est inconnue.
 *
 * Le dépôt reçoit le client anonyme : un BROUILLON est invisible pour lui, et
 * un article PROGRAMMÉ aussi — la RLS filtre `published_at <= now()`. Le cas
 * d'usage répète la condition, ce qui garde la fonction juste le jour où une
 * prévisualisation authentifiée sera ajoutée (Lot 12).
 */
export const getArticlePublie = cache(
  async (slug: string): Promise<Article | null> => {
    const resultat = await getPublishedArticleBySlug(portPublic(), slug);

    if (resultat.ok) return resultat.value;
    // `NOT_FOUND` est un cas normal — une adresse tapée à la main, un lien
    // périmé. Toute autre erreur est une panne et doit remonter.
    if (resultat.error.code === "NOT_FOUND") return null;
    throw resultat.error;
  },
);

/**
 * Les catégories, dans leur ordre d'affichage.
 *
 * ⚠️  Une lecture EN ÉCHEC rend une liste vide, contrairement aux articles.
 *
 * La différence est délibérée, et c'est la même que celle de `media.query.ts` :
 * sans les articles il n'y a pas de page, alors que sans les catégories il
 * reste les articles — les cartes perdent leur pastille et le filtre disparaît,
 * mais le contenu est là. Faire tomber `/actualites` parce qu'une liste de cinq
 * libellés n'a pas répondu serait une régression.
 */
export const getCategoriesArticles = cache(
  async (): Promise<ArticleCategory[]> => {
    const resultat = await listArticleCategories(portCategoriesPublic());
    return resultat.ok ? resultat.value : [];
  },
);

/**
 * Les catégories indexées par identifiant — ce dont une carte a besoin.
 *
 * Une Map plutôt qu'un tableau parce que l'appelant a un `categoryId` en main,
 * pas un rang. Un identifiant absent est absent de la Map : `parId.get(...)`
 * rend `undefined`, et la carte n'affiche alors pas de pastille — jamais une
 * pastille vide (invariant nº 2).
 */
export const getCategoriesParId = cache(
  async (): Promise<Map<string, ArticleCategory>> => {
    const categories = await getCategoriesArticles();
    return new Map(categories.map((categorie) => [categorie.id, categorie]));
  },
);

/** Les adresses publiées — `sitemap.ts`, et `generateStaticParams` au Lot 15. */
export async function getSlugsArticlesPublies(): Promise<string[]> {
  return (await getArticlesPublies()).map((article) => article.slug);
}
