import type { Article, UpdateArticle } from "../../cms/entities/article";
import type { ArticleDeps } from "../../cms/ports/article.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * Modifie un article existant.
 *
 * Ne change PAS le statut : c'est `setArticleStatus` qui s'en charge, parce que
 * la transition obéit à des règles propres, exige une autre permission et fixe
 * la date de publication au passage. Un cas d'usage, une intention.
 *
 * L'identifiant est un paramètre distinct de la charge utile (écart nº 20) :
 * il désigne la cible, il n'en fait pas partie.
 */
export async function updateArticle(
  deps: ArticleDeps,
  id: string,
  input: UpdateArticle,
): Promise<Result<Article>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Cet article n'existe plus."));
  }

  /*
    Le statut et l'auteur sont neutralisés plutôt qu'ignorés silencieusement.

    Un formulaire qui renverrait l'entité complète ne doit ni publier par effet
    de bord, ni changer la signature de l'article. Les repositories ne
    transmettent pas les champs `undefined`.
  */
  const champs: UpdateArticle = { ...input, status: undefined, authorId: undefined };

  // L'adresse n'est renormalisée que si elle a été touchée : réécrire un slug
  // publié casse les liens entrants et le référencement.
  if (input.slug !== undefined && input.slug !== existant.slug) {
    const slug = slugify(input.slug);

    if (!slug) {
      return err(
        new AppError("VALIDATION", "Cette adresse n'est pas valide.", {
          slug: "Adresse invalide.",
        }),
      );
    }

    const collision = await deps.read.findBySlug(slug);
    if (collision && collision.id !== existant.id) {
      return err(
        new AppError(
          "CONFLICT",
          `L'adresse « ${slug} » est déjà utilisée par un autre article.`,
          { slug: "Cette adresse est déjà prise." },
        ),
      );
    }

    champs.slug = slug;
  } else {
    // Pas de changement demandé : on ne renvoie pas le slug du tout, plutôt que
    // de réécrire la même valeur.
    delete champs.slug;
  }

  // Même vérification qu'à la création : une catégorie supprimée entre-temps
  // doit produire un message compréhensible, pas une violation de clé
  // étrangère.
  if (input.categoryId) {
    const categorie = await deps.categories.findById(input.categoryId);
    if (!categorie) {
      return err(
        new AppError(
          "VALIDATION",
          "La catégorie choisie n'existe plus. Sélectionnez-en une autre.",
          { categoryId: "Cette catégorie n'existe plus." },
        ),
      );
    }
  }

  return ok(await deps.write.update(existant.id, champs));
}
