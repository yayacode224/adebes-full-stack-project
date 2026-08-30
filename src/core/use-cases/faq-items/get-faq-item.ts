import type { FaqItem } from "../../cms/entities/faq-item";
import type { FaqItemReadPort } from "../../cms/ports/faq-item.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Récupère une question par son identifiant — écran d'édition du dashboard.
 *
 * Il n'existe pas de `getFaqItemBySlug` : une question n'a pas d'adresse
 * publique. C'est la quatrième collection du Lot 8 dans ce cas, après les
 * témoignages, l'équipe et les valeurs — et la conséquence se voit sur la
 * fiche, dont le lien « Voir sur le site » pointe vers la page du SUJET.
 */
export async function getFaqItemById(
  read: FaqItemReadPort,
  id: string,
): Promise<Result<FaqItem>> {
  const question = await read.findById(id);
  if (!question) {
    return err(new AppError("NOT_FOUND", "Cette question n'existe plus."));
  }
  return ok(question);
}
