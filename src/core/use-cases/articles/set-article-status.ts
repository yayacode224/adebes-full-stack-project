import type { Article } from "../../cms/entities/article";
import type { ArticleDeps } from "../../cms/ports/article.port";
import {
  canTransition,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "../../cms/entities/content-status";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Fait passer un article d'un état à un autre.
 *
 * Isolé de `updateArticle` parce que publier n'est pas modifier : la
 * transition obéit à des règles propres, exige la permission `article:publish`
 * et — spécificité de ce lot — FIXE la date de publication.
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission : le contrôle d'accès
 * appartient à `createAction`, et la base le double avec `guard_publish`
 * (ADB01, migration 0010).
 */
export async function setArticleStatus(
  deps: ArticleDeps,
  input: { id: string; status: ContentStatus },
): Promise<Result<Article>> {
  const existant = await deps.read.findById(input.id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Cet article n'existe plus."));
  }

  // Rejouer la même transition n'est pas une erreur : deux clics sur
  // « Publier », ou deux onglets ouverts, ne doivent pas produire un message
  // d'échec alors que le résultat voulu est déjà atteint.
  if (existant.status === input.status) {
    return ok(existant);
  }

  if (!canTransition(existant.status, input.status)) {
    return err(
      new AppError(
        "VALIDATION",
        `Un contenu « ${CONTENT_STATUS_LABELS[existant.status]} » ne peut pas passer directement à « ${CONTENT_STATUS_LABELS[input.status]} ».`,
      ),
    );
  }

  // Publier un article vide produirait une page blanche en ligne. La
  // vérification est faite ici plutôt qu'au schéma : un BROUILLON a le droit
  // d'être incomplet, c'est même sa raison d'être.
  if (input.status === "published") {
    const manquants = champsManquants(existant);
    if (manquants.length > 0) {
      return err(
        new AppError(
          "VALIDATION",
          `Cet article ne peut pas être publié : il manque ${manquants.join(", ")}.`,
        ),
      );
    }
  }

  /*
    ═══════════════════════════════════════════════════════════════════════
     LA DATE DE PUBLICATION EST FIXÉE À LA PREMIÈRE MISE EN LIGNE
    ═══════════════════════════════════════════════════════════════════════

    Un article publié sans date serait visible — la RLS l'autorise
    (`published_at is null or published_at <= now()`) — mais introuvable dans
    un fil trié par date. Ce n'est pas un chiffre fabriqué : l'instant de la
    publication EST la date de publication, et c'est la seule information que
    l'on possède avec certitude à cette seconde.

    ⚠️  Une date DÉJÀ saisie n'est jamais écrasée, dans le passé comme dans le
    futur : c'est ce qui rend possible la reprise d'un article ancien et la
    publication programmée du Lot 12. Republier un article dépublié conserve
    donc sa date d'origine, ce qui est le comportement attendu — sa date de
    publication n'a pas changé.
  */
  const dateAFixer =
    input.status === "published" && existant.publishedAt === null
      ? new Date().toISOString()
      : undefined;

  return ok(await deps.write.setStatus(existant.id, input.status, dateAFixer));
}

/** Ce qu'un article doit contenir pour être présentable au public. */
function champsManquants(article: Article): string[] {
  const manquants: string[] = [];
  if (!article.title.trim()) manquants.push("le titre");
  if (!article.excerpt.trim()) manquants.push("le chapô");
  if (article.body.length === 0) manquants.push("au moins un paragraphe");
  return manquants;
}
