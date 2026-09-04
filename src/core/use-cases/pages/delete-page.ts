import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime une page et ses sections.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE PAGE SYSTÈME NE SE SUPPRIME PAS — TROIS BARRIÈRES, ET C'EST VOULU
 * ---------------------------------------------------------------------------
 * 1. L'écran ne propose pas l'action : la ligne d'une page système n'a pas
 *    d'entrée « Supprimer » dans son menu ;
 * 2. ce cas d'usage la refuse, avec un message qui explique pourquoi ;
 * 3. le trigger `guard_system_page` (migration 0010) lève au niveau de la base.
 *
 * La recette du lot vérifie la troisième en tentant la suppression par un accès
 * direct — c'est la seule des trois qu'aucun contournement de l'applicatif ne
 * franchit. Les deux premières existent pour que le refus soit COMPRÉHENSIBLE :
 * une contrainte de base rend un message technique, pas une explication.
 *
 * ⚠️  La suppression emporte les sections en cascade (`on delete cascade`,
 * migration 0006). C'est ce qu'on veut — une section orpheline n'a aucun sens —
 * mais cela rend l'action irréversible tant que le Lot 12 n'a pas livré les
 * versions de contenu. Le dialogue de confirmation annonce le nombre de
 * sections perdues.
 */
export async function deletePage(
  deps: PageDeps,
  id: string,
): Promise<Result<void>> {
  const page = await deps.read.findById(id);
  if (!page) {
    return err(new AppError("NOT_FOUND", "Cette page n'existe plus."));
  }

  if (page.isSystem) {
    return err(
      new AppError(
        "VALIDATION",
        `« ${page.title} » fait partie de la structure du site et ne peut pas être supprimée. Vous pouvez la dépublier, ou masquer ses sections une à une.`,
      ),
    );
  }

  await deps.write.delete(id);
  return ok(undefined);
}
