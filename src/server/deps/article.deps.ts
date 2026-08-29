import "server-only";

import type {
  ArticleCategoryDeps,
  ArticleCategoryReadPort,
  ArticleDeps,
  ArticleReadPort,
} from "@/core/cms/ports/article.port";
import { createServerClient } from "@/infrastructure/supabase/clients/server";
import { SupabaseArticleCategoryRepository } from "@/infrastructure/supabase/repositories/article-category.repository";
import { SupabaseArticleRepository } from "@/infrastructure/supabase/repositories/article.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COMPOSITION DES DÉPENDANCES DES ACTUALITÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Gabarit de `programme.deps.ts` (écart nº 44). Les deux points qui se perdent
 * en le recopiant :
 *
 *   1. **Le client est reconstruit à CHAQUE appel.** `createServerClient()` lit
 *      les cookies de LA requête en cours ; mémoriser l'objet au niveau du
 *      module le ferait fuiter d'un visiteur à l'autre.
 *   2. **Une page du dashboard demande le port de LECTURE seul.** Une page qui
 *      affiche une liste ne doit pas recevoir un objet capable de supprimer, et
 *      le type l'en empêche.
 *
 * Un seul client Supabase alimente les DEUX dépôts d'un même appel : ils
 * partagent la session, et en construire deux doublerait le travail pour rien.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE FICHIER N'EST PAS IMPORTABLE DEPUIS `src/server/queries/`
 * ---------------------------------------------------------------------------
 * Il importe `clients/server`, donc `next/headers`. La règle ESLint qui protège
 * `server/queries/**` interdit cet import direct ; l'atteindre par ricochet la
 * rendrait inopérante. La lecture publique compose son propre dépôt, avec
 * `createPublicClient()`, dans `server/queries/articles.query.ts`.
 */
export async function articleDeps(): Promise<ArticleDeps> {
  const supabase = await createServerClient();

  const articles = new SupabaseArticleRepository(supabase);
  const categories = new SupabaseArticleCategoryRepository(supabase);

  return { read: articles, write: articles, categories };
}

/** Les dépendances de gestion des catégories. */
export async function articleCategoryDeps(): Promise<ArticleCategoryDeps> {
  const supabase = await createServerClient();

  const categories = new SupabaseArticleCategoryRepository(supabase);
  const articles = new SupabaseArticleRepository(supabase);

  return { read: categories, write: categories, articles };
}

/** Le port de LECTURE seul — pour les pages du dashboard. */
export async function articleReadPort(): Promise<ArticleReadPort> {
  return new SupabaseArticleRepository(await createServerClient());
}

/** Idem pour les catégories : lire la liste ne donne pas le droit de l'écrire. */
export async function articleCategoryReadPort(): Promise<ArticleCategoryReadPort> {
  return new SupabaseArticleCategoryRepository(await createServerClient());
}
