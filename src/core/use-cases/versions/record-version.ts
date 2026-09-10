import {
  VERSION_RETENTION,
  type ContentVersion,
  type CreateContentVersion,
} from "../../cms/entities/content-version";
import type { ContentVersionDeps } from "../../cms/ports/content-version.port";
import { ok, type Result } from "../../shared/result";

/**
 * Enregistre un instantané, puis purge les plus anciens au-delà de la rétention
 * (§12.2 du Rapport 2).
 *
 * ---------------------------------------------------------------------------
 * APPELÉ APRÈS UNE PUBLICATION, DEPUIS LA SERVER ACTION
 * ---------------------------------------------------------------------------
 * Et non depuis `setArticleStatus` : le cas d'usage de transition n'a pas à
 * connaître l'historique, et le coupler à `ContentVersionDeps` l'aurait imposé
 * à toute la chaîne de l'article. La Server Action, elle, compose déjà les deux
 * mondes — c'est son rôle.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  NE JAMAIS FAIRE ÉCHOUER L'APPELANT
 * ---------------------------------------------------------------------------
 * La publication est committée quand ce cas d'usage s'exécute. Renvoyer une
 * erreur ferait croire à l'utilisateur que la mise en ligne n'a pas eu lieu,
 * alors que seul l'instantané a manqué. L'appelant traite donc le `Result`
 * comme informatif — même discipline que le journal d'audit dans
 * `createAction`.
 */
export async function recordVersion(
  deps: ContentVersionDeps,
  input: CreateContentVersion,
): Promise<Result<{ version: ContentVersion; pruned: number }>> {
  const version = await deps.write.record(input);

  // La purge est bornée à l'entité concernée : `pruneToLast` ne touche jamais
  // l'historique d'un autre article.
  const pruned = await deps.write.pruneToLast(
    input.entityType,
    input.entityId,
    VERSION_RETENTION,
  );

  return ok({ version, pruned });
}
