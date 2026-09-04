import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Supprime une section.
 *
 * ---------------------------------------------------------------------------
 * LA RENUMÉROTATION EST FAITE ICI, PAS LAISSÉE À LA BASE
 * ---------------------------------------------------------------------------
 * Supprimer la 2ᵉ section de cinq laisserait les positions 1, 3, 4, 5. Rien ne
 * casse — l'ordre est préservé — mais le trou se propage : le prochain ajout
 * calcule sa position sur `sections.length + 1`, c'est-à-dire 5, une position
 * déjà prise. Deux sections finissent alors à égalité, et leur ordre relatif
 * dépend de l'ordre de lecture de PostgreSQL, qui n'en garantit aucun.
 *
 * `reorder()` sur la liste restante renumérote de 1 à N en une transaction.
 *
 * ⚠️  L'appel N'EST PAS conditionnel à la présence d'un trou. Le vérifier
 * d'abord aurait demandé une lecture de plus pour économiser une écriture sur
 * une table qui en compte trente lignes.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  MASQUER PLUTÔT QUE SUPPRIMER — CE QUE L'ÉCRAN DOIT DIRE
 * ---------------------------------------------------------------------------
 * La suppression est définitive tant que le Lot 12 n'a pas livré les versions
 * de contenu. Le dialogue de confirmation propose donc explicitement l'autre
 * geste : masquer la section la retire du site en gardant son contenu.
 */
export async function deleteSection(
  deps: PageDeps,
  id: string,
): Promise<Result<void>> {
  const section = await deps.sectionRead.findById(id);
  if (!section) {
    return err(new AppError("NOT_FOUND", "Cette section n'existe plus."));
  }

  await deps.sectionWrite.delete(id);

  const restantes = await deps.sectionRead.findByPage(section.pageId);
  if (restantes.length > 0) {
    await deps.sectionWrite.reorder(restantes.map((autre) => autre.id));
  }

  return ok(undefined);
}
