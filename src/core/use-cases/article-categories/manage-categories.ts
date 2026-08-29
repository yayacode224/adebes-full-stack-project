import type {
  ArticleCategory,
  CreateArticleCategory,
} from "../../cms/entities/article";
import type {
  ArticleCategoryDeps,
  ArticleCategoryReadPort,
} from "../../cms/ports/article.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES CATÉGORIES D'ACTUALITÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8B du Rapport 2 : « catégories gérables ». Cinq cas d'usage courts, réunis
 * dans un seul fichier — contrairement aux articles, dont chaque cas d'usage a
 * le sien.
 *
 * Ce n'est pas une entorse à la règle « un cas d'usage, une intention » : ce
 * sont bien cinq fonctions distinctes, avec chacune ses règles. Elles tiennent
 * ensemble parce qu'aucune ne dépasse quinze lignes et qu'elles se lisent en
 * bloc — un libellé, une adresse, un ordre. Éclater cela en cinq fichiers de
 * douze lignes aurait rendu la règle de suppression (la seule qui compte
 * vraiment) plus difficile à trouver, pas plus facile.
 *
 * ---------------------------------------------------------------------------
 * LA RÈGLE QUI COMPTE : ON NE SUPPRIME PAS UNE CATÉGORIE UTILISÉE
 * ---------------------------------------------------------------------------
 * `articles.category_id` est déclarée `on delete restrict` (migration 0005) :
 * la base refuse déjà, avec une erreur 23503. Mais le message qu'elle produit
 * — « Cette catégorie est utilisée ailleurs » — ne dit pas COMBIEN d'articles
 * sont concernés, ni qu'il faut les reclasser d'abord. On compte donc avant,
 * pour pouvoir le dire.
 */

/** Toutes les catégories, dans leur ordre d'affichage. */
export async function listArticleCategories(
  read: ArticleCategoryReadPort,
): Promise<Result<ArticleCategory[]>> {
  return ok(await read.findAll());
}

export async function createArticleCategory(
  deps: ArticleCategoryDeps,
  input: CreateArticleCategory,
): Promise<Result<ArticleCategory>> {
  const slug = input.slug?.trim() || slugify(input.label);

  if (!slug) {
    return err(
      new AppError(
        "VALIDATION",
        "Impossible de déduire une adresse à partir de ce nom. Choisissez-en un autre.",
        { label: "Ce nom ne peut pas servir d'adresse." },
      ),
    );
  }

  if (await deps.read.findBySlug(slug)) {
    return err(
      new AppError("CONFLICT", `La catégorie « ${input.label} » existe déjà.`, {
        label: "Cette catégorie existe déjà.",
      }),
    );
  }

  // En fin de liste : une catégorie créée doit apparaître là où l'utilisateur
  // vient de cliquer, pas s'intercaler en tête.
  const existantes = await deps.read.findAll();

  return ok(
    await deps.write.create({
      label: input.label,
      slug,
      position: input.position ?? existantes.length + 1,
    }),
  );
}

/**
 * Renomme une catégorie.
 *
 * ⚠️  L'ADRESSE N'EST PAS RECALCULÉE. Le `slug` d'une catégorie n'apparaît dans
 * aucune URL publique aujourd'hui — le filtre de `/actualites` travaille sur
 * les libellés — mais il est la clé de rapprochement du seed et le sera d'une
 * éventuelle page `/actualites/categorie/<slug>` (Lot 15). Le recalculer à
 * chaque correction de faute de frappe casserait ces deux usages sans prévenir.
 */
export async function updateArticleCategory(
  deps: ArticleCategoryDeps,
  id: string,
  label: string,
): Promise<Result<ArticleCategory>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette catégorie n'existe plus."));
  }

  return ok(await deps.write.update(existante.id, { label }));
}

export async function deleteArticleCategory(
  deps: ArticleCategoryDeps,
  id: string,
): Promise<Result<{ id: string; label: string }>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette catégorie n'existe plus."));
  }

  const utilisations = await deps.articles.countByCategory(id);
  if (utilisations > 0) {
    return err(
      new AppError(
        "CONFLICT",
        utilisations === 1
          ? `« ${existante.label} » est encore utilisée par 1 article. Reclassez-le avant de supprimer la catégorie.`
          : `« ${existante.label} » est encore utilisée par ${utilisations} articles. Reclassez-les avant de supprimer la catégorie.`,
      ),
    );
  }

  await deps.write.delete(id);
  return ok({ id, label: existante.label });
}

/**
 * Réordonne les catégories.
 *
 * Reçoit la liste ENTIÈRE dans le nouvel ordre — mêmes raisons qu'au Lot 8A :
 * une écriture en une transaction, et deux personnes qui réordonnent en même
 * temps produisent chacune un résultat complet et cohérent, au lieu de deux
 * décalages qui se composent en un ordre que personne n'a voulu.
 */
export async function reorderArticleCategories(
  deps: ArticleCategoryDeps,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) {
    return err(new AppError("VALIDATION", "Aucun élément à réordonner."));
  }

  if (new Set(orderedIds).size !== orderedIds.length) {
    return err(
      new AppError("VALIDATION", "La liste contient deux fois la même catégorie."),
    );
  }

  const connues = await deps.read.findAll();
  const idsConnus = new Set(connues.map((c) => c.id));

  if (orderedIds.some((id) => !idsConnus.has(id))) {
    return err(
      new AppError("NOT_FOUND", "Une des catégories à réordonner n'existe plus."),
    );
  }

  // La liste doit être exhaustive : une catégorie absente garderait son
  // ancienne position et viendrait s'intercaler n'importe où.
  if (orderedIds.length !== connues.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste de réordonnancement doit contenir toutes les catégories.",
      ),
    );
  }

  await deps.write.reorder(orderedIds);
  return ok(undefined);
}
