import type { Stat, UpdateStat } from "../../cms/entities/stat";
import type { StatDeps } from "../../cms/ports/stat.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Modifie un chiffre clé.
 *
 * Ne change PAS la visibilité : c'est `setStatVisibility` qui s'en charge,
 * parce que retirer un chiffre du site est une intention distincte de corriger
 * son libellé. Un cas d'usage, une intention (§7 du Rapport 1).
 *
 * L'identifiant est un paramètre distinct de la charge utile : il désigne la
 * cible, il n'en fait pas partie (écart nº 20).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX CHAMPS SONT NEUTRALISÉS, ET LES DEUX POUR DES RAISONS DIFFÉRENTES
 * ---------------------------------------------------------------------------
 *   * **`isVisible`** — même raison qu'au Lot 8E : un formulaire qui renverrait
 *     l'entité complète ne doit pas retirer un chiffre de deux pages publiques
 *     par effet de bord, en même temps qu'une correction d'orthographe.
 *
 *   * **`key`** — l'identifiant technique est IMMUABLE (écart nº 124). Il est
 *     dérivé du libellé à la création, puis figé. Le laisser modifiable aurait
 *     été le pire des deux mondes : invisible dans l'interface, donc jamais
 *     corrigé volontairement, mais réécrivable par un POST direct — et une clé
 *     qui change casse silencieusement toute référence future (Lot 9).
 *
 *     ⚠️  Le libellé, lui, reste librement modifiable. La clé ne le suit pas,
 *     et c'est voulu : elle cesse d'être « le libellé en minuscules » dès la
 *     première reformulation, ce qui est exactement la définition d'un
 *     identifiant stable.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUNE GARDE PROPRE À CE LOT — ET C'EST UN CONSTAT, PAS UN OUBLI
 * ---------------------------------------------------------------------------
 * Les Lots 8C et 8D en portaient une parce qu'un état FAUX était atteignable :
 * une citation sans accord, un marqueur affiché à la place d'un nom. Le Lot 8F
 * a établi que l'absence se CONSTATE (écart nº 118), et c'est de nouveau le cas
 * ici.
 *
 * L'état faux que cette collection pourrait produire — un chiffre inventé — ne
 * se reconnaît par AUCUN moyen automatique : rien, dans « 4 200 », ne dit s'il
 * vient d'un rapport d'activité ou d'une estimation de comptoir. Une garde
 * n'aurait donc rien à vérifier.
 *
 * Ce que le lot fait à la place, et qui est la seule réponse honnête :
 *
 *   * `null` est REPRÉSENTABLE — on peut dire « je ne sais pas » sans mentir ;
 *   * `toConfirm` permet de dire « ce chiffre est à revalider » et le dashboard
 *     le compte ;
 *   * `note` accompagne chaque chiffre de sa source sur `/impact`.
 *
 * Trois façons de dire la vérité valent mieux qu'une règle qui ne peut pas la
 * vérifier.
 */
export async function updateStat(
  deps: StatDeps,
  id: string,
  input: UpdateStat,
): Promise<Result<Stat>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce chiffre n'existe plus."));
  }

  /*
    ⚠️  `undefined` NEUTRALISE, il n'efface pas : les mappers ne transmettent
    que les champs réellement définis (`toStatUpdate`). C'est aussi ce qui
    permet à `value: null` de traverser intact — `null` n'est PAS `undefined`,
    et la distinction est ici la traduction exacte de l'invariant nº 1.
  */
  const champs: UpdateStat = { ...input, isVisible: undefined, key: undefined };

  return ok(await deps.write.update(existant.id, champs));
}
