import type { CoreValue, UpdateCoreValue } from "../../cms/entities/core-value";
import type { CoreValueDeps } from "../../cms/ports/core-value.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Modifie une valeur de l'association.
 *
 * Ne change PAS la visibilité : c'est `setCoreValueVisibility` qui s'en charge,
 * parce que retirer une valeur du site est une intention distincte de corriger
 * son texte. Un cas d'usage, une intention (§7 du Rapport 1).
 *
 * L'identifiant est un paramètre distinct de la charge utile : il désigne la
 * cible, il n'en fait pas partie.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUNE « PORTE DE DERRIÈRE » À FERMER ICI — ET IL FAUT SAVOIR POURQUOI
 * ---------------------------------------------------------------------------
 * Les Lots 8C et 8D ajoutaient à cet endroit une garde : republier une citation
 * après avoir retiré l'accord, remettre « [À COMPLÉTER] » à la place d'un nom
 * déjà en ligne. Dans les deux cas, une modification anodine pouvait produire
 * sur le site un état que la garde de publication interdisait d'atteindre
 * directement.
 *
 * Cette collection n'a pas de tel état. Les quatre champs modifiables sont
 * contraints par le schéma seul, et aucune de leurs valeurs valides n'est
 * interdite d'affichage :
 *
 *   * `title` et `description` sont non vides et bornés ;
 *   * `icon` est un `z.enum(ICON_NAMES)` — depuis ce lot, une icône inconnue
 *     n'est plus représentable ;
 *   * `tone` est un `z.enum(MEDIA_TONES)` depuis le Lot 8A.
 *
 * Il n'y a donc rien à vérifier de plus, et **inventer une garde sans état
 * interdit à protéger serait pire qu'inutile** : elle donnerait l'illusion
 * d'une défense, et la première personne à la lire chercherait longtemps
 * l'attaque qu'elle repousse.
 *
 * Ce qui reste, et qui est réel : la neutralisation de `isVisible` ci-dessous.
 */
export async function updateCoreValue(
  deps: CoreValueDeps,
  id: string,
  input: UpdateCoreValue,
): Promise<Result<CoreValue>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette valeur n'existe plus."));
  }

  /*
    La visibilité est neutralisée plutôt qu'ignorée silencieusement : un
    formulaire qui renverrait l'entité complète ne doit pas retirer une valeur
    de deux pages publiques par effet de bord. Les repositories ne transmettent
    pas les champs `undefined`.
  */
  const champs: UpdateCoreValue = { ...input, isVisible: undefined };

  return ok(await deps.write.update(existante.id, champs));
}
