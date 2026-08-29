import type { Article, CreateArticle } from "../../cms/entities/article";
import type { ArticleDeps } from "../../cms/ports/article.port";
import { AppError } from "../../shared/errors";
import { tempsDeLecture } from "../../shared/reading-time";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * Crée un article.
 *
 * Quatre règles métier, et rien d'autre : ce fichier ne sait ni ce qu'est une
 * requête HTTP, ni ce qu'est Supabase. Il se teste avec un dépôt en mémoire.
 */
export async function createArticle(
  deps: ArticleDeps,
  input: CreateArticle,
): Promise<Result<Article>> {
  // 1. L'adresse est proposée à partir du titre si elle n'a pas été saisie.
  const slug = input.slug?.trim() || slugify(input.title);

  if (!slug) {
    return err(
      new AppError(
        "VALIDATION",
        "Impossible de déduire une adresse à partir de ce titre. Saisissez-la manuellement.",
        { slug: "Adresse obligatoire." },
      ),
    );
  }

  // 2. Unicité. La base porte aussi une contrainte `unique`, mais la vérifier
  //    ici permet de renvoyer un message utile SUR LE BON CHAMP plutôt que de
  //    traduire après coup une violation 23505.
  if (await deps.read.findBySlug(slug)) {
    return err(
      new AppError(
        "CONFLICT",
        `L'adresse « ${slug} » est déjà utilisée par un autre article.`,
        { slug: "Cette adresse est déjà prise." },
      ),
    );
  }

  /*
    3. La catégorie doit exister.

    `articles.category_id` est une clé étrangère `on delete restrict` : la base
    refuserait de toute façon un identifiant inconnu, mais avec une erreur 23503
    dont le message parle de contrainte. Vérifier ici permet de nommer le
    problème dans les mots de l'utilisateur, et sur le bon champ — le cas réel
    étant une catégorie supprimée dans un autre onglet pendant la saisie.
  */
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

  /*
    4. Le temps de lecture est CALCULÉ quand il n'a pas été fourni (§8B).

    `?? tempsDeLecture(...)` et non `|| …` : une valeur saisie de 1 minute est
    légitime et ne doit pas être écrasée. Seul `null` déclenche l'estimation.
  */
  const readingMinutes = input.readingMinutes ?? tempsDeLecture(input.body);

  return ok(
    await deps.write.create({
      ...input,
      slug,
      readingMinutes,
      // Un article naît TOUJOURS en brouillon. Publier est une décision
      // explicite, qui exige la permission `article:publish`.
      status: input.status ?? "draft",
    }),
  );
}
