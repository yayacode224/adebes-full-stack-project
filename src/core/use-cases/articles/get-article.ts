import type { Article } from "../../cms/entities/article";
import type { ArticleReadPort } from "../../cms/ports/article.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/** Récupère un article par son adresse — page publique `/actualites/[slug]`. */
export async function getArticleBySlug(
  read: ArticleReadPort,
  slug: string,
): Promise<Result<Article>> {
  const article = await read.findBySlug(slug);
  if (!article) {
    return err(
      new AppError("NOT_FOUND", "Cet article n'existe pas ou n'est plus en ligne."),
    );
  }
  return ok(article);
}

/**
 * Récupère un article PUBLIÉ par son adresse.
 *
 * ⚠️  La condition de date est répétée ici alors que la RLS l'impose déjà à la
 * clé `anon` (écart nº 12) : les deux barrières sont indépendantes, et cette
 * fonction doit rester correcte même appelée avec un client authentifié — ce
 * qui sera le cas le jour où une prévisualisation sera ajoutée (Lot 12).
 *
 * Sans elle, un article programmé pour le mois prochain deviendrait lisible
 * par quiconque connaît son adresse.
 */
export async function getPublishedArticleBySlug(
  read: ArticleReadPort,
  slug: string,
): Promise<Result<Article>> {
  const article = await read.findBySlug(slug);

  const visible =
    article !== null &&
    article.status === "published" &&
    (article.publishedAt === null ||
      Date.parse(article.publishedAt) <= Date.now());

  if (!visible) {
    return err(
      new AppError("NOT_FOUND", "Cet article n'existe pas ou n'est plus en ligne."),
    );
  }
  return ok(article);
}

/** Récupère un article par son identifiant — écran d'édition du dashboard. */
export async function getArticleById(
  read: ArticleReadPort,
  id: string,
): Promise<Result<Article>> {
  const article = await read.findById(id);
  if (!article) {
    return err(new AppError("NOT_FOUND", "Cet article n'existe plus."));
  }
  return ok(article);
}
