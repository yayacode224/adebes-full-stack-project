import type { FaqItemDeps } from "../../cms/ports/faq-item.port";
import { AppError } from "../../shared/errors";
import { MAX_PAGE_SIZE } from "../../shared/pagination";
import { err, ok, type Result } from "../../shared/result";

/**
 * Réordonne la liste complète des questions fréquentes.
 *
 * Reçoit la liste ENTIÈRE dans le nouvel ordre, pas un déplacement « de
 * l'index 3 vers l'index 1 ». Deux raisons, identiques aux Lots 8A à 8E :
 *
 *   * le réordonnancement s'écrit en une seule transaction, sans lecture
 *     intermédiaire ni calcul de décalage ;
 *   * deux personnes qui réordonnent en même temps produisent un résultat
 *     complet et cohérent chacune, au lieu de deux décalages qui se composent
 *     en un ordre que personne n'a voulu.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'ORDRE EST GLOBAL, ET IL DÉCIDE DE CE QUI EST VISIBLE SUR L'ACCUEIL
 * ---------------------------------------------------------------------------
 * `reorder_rows` renumérote la table ENTIÈRE de 1 à N, tous sujets confondus.
 * Une question de bénévolat déplacée en tête décale donc les positions des
 * questions de don, alors qu'elles ne partagent aucune page.
 *
 * Ce n'est visible qu'à un endroit, mais il compte : l'accueil affiche **les
 * quatre premières questions hors bénévolat**. Remonter une question générale
 * peut donc en faire disparaître une autre de l'accueil, sans qu'aucun statut
 * n'ait changé.
 *
 * C'est le même mécanisme qu'au Lot 8C, où l'ordre décidait des trois
 * témoignages affichés — et la réponse est la même : l'écran de liste le DIT,
 * en marquant les lignes qui figurent sur l'accueil. Interdire le
 * réordonnancement pour cette raison aurait été absurde ; le laisser muet
 * aurait fait disparaître du contenu sans explication.
 */
export async function reorderFaqItems(
  deps: FaqItemDeps,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) {
    return err(new AppError("VALIDATION", "Aucun élément à réordonner."));
  }

  // Un identifiant en double renumérote deux lignes à la même position et rend
  // l'ordre non déterministe à la lecture suivante.
  if (new Set(orderedIds).size !== orderedIds.length) {
    return err(
      new AppError("VALIDATION", "La liste contient deux fois le même élément."),
    );
  }

  // La liste doit être exhaustive : une question absente garderait son ancienne
  // position et viendrait s'intercaler n'importe où. C'est le défaut le plus
  // probable si l'interface ne transmet que la page affichée.
  const connues = await deps.read.findAll({ pageSize: MAX_PAGE_SIZE });
  const idsConnus = new Set(connues.map((question) => question.id));

  const inconnus = orderedIds.filter((id) => !idsConnus.has(id));
  if (inconnus.length > 0) {
    return err(
      new AppError("NOT_FOUND", "Une des questions à réordonner n'existe plus."),
    );
  }

  if (orderedIds.length !== connues.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste de réordonnancement doit contenir toutes les questions.",
      ),
    );
  }

  await deps.write.reorder(orderedIds);
  return ok(undefined);
}
