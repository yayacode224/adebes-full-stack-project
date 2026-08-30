import type { FaqItem, UpdateFaqItem } from "../../cms/entities/faq-item";
import type { FaqItemDeps } from "../../cms/ports/faq-item.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Modifie une question fréquente.
 *
 * Ne change PAS le statut : c'est `setFaqItemStatus` qui s'en charge, parce que
 * la transition obéit à des règles propres et exige une autre permission. Un
 * cas d'usage, une intention (§7 du Rapport 1).
 *
 * L'identifiant est un paramètre distinct de la charge utile : il désigne la
 * cible, il n'en fait pas partie (écart nº 20).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CHANGER LE SUJET D'UNE QUESTION EN LIGNE LA DÉPLACE DE PAGE
 * ---------------------------------------------------------------------------
 * C'est le seul champ de cette collection dont la modification a un effet que
 * l'éditeur ne voit pas sur l'écran où il travaille : passer une question de
 * « Dons » à « Bénévolat » la retire de `/don` et l'ajoute à `/benevolat`, et
 * la retire de l'accueil au passage.
 *
 * La tentation était d'en faire une garde, sur le modèle des Lots 8C et 8D.
 * Elle a été écartée, et il faut dire pourquoi : les gardes de ces deux lots
 * empêchent un état FAUX — une citation non autorisée, un marqueur affiché
 * comme un nom. Ici, aucun état n'est faux. Une question de bénévolat rangée
 * dans « Dons » est une erreur de classement, qui se corrige précisément par
 * cette modification. Refuser reviendrait à empêcher la correction.
 *
 * Ce qui est fait à la place : le formulaire ÉCRIT la conséquence, sous le
 * champ « Sujet », en nommant la page de départ et celle d'arrivée. C'est la
 * réponse du Lot 8E — informer plutôt qu'interdire — appliquée à un champ dont
 * l'effet est réel mais légitime.
 */
export async function updateFaqItem(
  deps: FaqItemDeps,
  id: string,
  input: UpdateFaqItem,
): Promise<Result<FaqItem>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette question n'existe plus."));
  }

  // Le statut est neutralisé plutôt qu'ignoré silencieusement : un formulaire
  // qui renverrait l'entité complète ne doit pas publier par effet de bord.
  // Les repositories ne transmettent pas les champs `undefined`.
  const champs: UpdateFaqItem = { ...input, status: undefined };

  return ok(await deps.write.update(existante.id, champs));
}
