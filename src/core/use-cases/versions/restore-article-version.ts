import type { Article } from "../../cms/entities/article";
import type { ArticleDeps } from "../../cms/ports/article.port";
import type { ContentVersionDeps } from "../../cms/ports/content-version.port";
import { articleSchema } from "../../cms/schemas/article.schema";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { updateArticle } from "../articles/update-article";
import { recordVersion } from "./record-version";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RESTAURER UN ARTICLE DANS L'ÉTAT D'UNE VERSION ANTÉRIEURE (§12.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Restaurer une version antérieure remet le contenu. » — recette du §12.
 *
 * ---------------------------------------------------------------------------
 * CE QUI EST REMIS EN PLACE, ET CE QUI NE L'EST PAS
 * ---------------------------------------------------------------------------
 * Restaurés : titre, chapô, corps, catégorie, couverture, temps de lecture,
 * marqueur « exemple », adresse.
 *
 * PAS restaurés : `status` et `publishedAt`. Restaurer un texte ne doit ni
 * dépublier un article en ligne, ni le reprogrammer, ni changer sa date de
 * parution — ce sont des décisions éditoriales distinctes, avec leur propre
 * commande et leur propre permission. L'écran d'historique l'indique.
 *
 * ---------------------------------------------------------------------------
 * LA RESTAURATION EST ELLE-MÊME VERSIONNÉE
 * ---------------------------------------------------------------------------
 * Un instantané est pris juste après, avec le commentaire « Restauration de la
 * version N ». Se tromper de version à restaurer ne doit pas être une impasse :
 * l'état d'avant la restauration reste dans l'historique.
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission — c'est le rôle de
 * `createAction` (`article:update`).
 */
export async function restoreArticleVersion(
  deps: { versions: ContentVersionDeps; articles: ArticleDeps },
  versionId: string,
  restoredBy: string | null,
): Promise<Result<Article>> {
  const version = await deps.versions.read.findById(versionId);
  if (!version) {
    return err(new AppError("NOT_FOUND", "Cette version n'existe plus."));
  }

  if (version.entityType !== "article") {
    return err(
      new AppError(
        "VALIDATION",
        "Cette version n'appartient pas à un article et ne peut pas être restaurée ici.",
      ),
    );
  }

  // Le snapshot est du JSONB : rien ne garantit sa forme. `articleSchema` la
  // rétablit, ou l'on refuse plutôt que de réécrire l'article avec des champs
  // partiels.
  const analyse = articleSchema.safeParse(version.snapshot);
  if (!analyse.success) {
    return err(
      new AppError(
        "VALIDATION",
        "L'instantané de cette version est illisible et ne peut pas être restauré.",
      ),
    );
  }
  const instantane = analyse.data;

  const cible = await deps.articles.read.findById(version.entityId);
  if (!cible) {
    return err(
      new AppError(
        "NOT_FOUND",
        "L'article associé à cette version n'existe plus.",
      ),
    );
  }

  const restauration = await updateArticle(deps.articles, version.entityId, {
    slug: instantane.slug,
    title: instantane.title,
    excerpt: instantane.excerpt,
    body: instantane.body,
    categoryId: instantane.categoryId,
    coverMediaId: instantane.coverMediaId,
    readingMinutes: instantane.readingMinutes,
    isPlaceholder: instantane.isPlaceholder,
  });
  if (!restauration.ok) return restauration;

  // Filet : l'échec de l'instantané ne doit pas défaire une restauration déjà
  // écrite. `recordVersion` ne lève pas pour une erreur métier ; une panne
  // réelle remonterait à `createAction`, qui la journalise.
  await recordVersion(deps.versions, {
    entityType: "article",
    entityId: version.entityId,
    snapshot: restauration.value,
    comment: `Restauration de la version ${version.versionNumber}`,
    createdBy: restoredBy,
  });

  return ok(restauration.value);
}
