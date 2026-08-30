import { ICON_NAME_REPLI, isIconName } from "@/core/cms/entities/icon-name";
import type { CreateStatRow, Stat, UpdateStat } from "@/core/cms/entities/stat";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  C'est le SEUL endroit du dépôt où l'on passe de `snake_case` à
 * `camelCase`. Aucun composant, aucun cas d'usage, aucune page ne doit jamais
 * voir `is_visible` ni `to_confirm`.
 */

/**
 * SQL → domaine.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `value` EST RECOPIÉ TEL QUEL — C'EST LA LIGNE LA PLUS IMPORTANTE DU LOT
 * ---------------------------------------------------------------------------
 * `row.value` est `number | null`, et l'entité déclare `number | null`. Il n'y
 * a donc RIEN à convertir, et c'est bien le problème : cette ligne ressemble à
 * une ligne sans enjeu, et un `?? 0` y passerait la relecture sans être
 * remarqué. Il transformerait « chiffre pas encore disponible » en « zéro
 * bénéficiaire » sur la page la plus visitée du site.
 *
 * L'invariant nº 1 du projet tient, entre autres, à ce que cette ligne ne
 * change jamais. La recette le vérifie sur la ligne `beneficiaires` de la base
 * réelle, pas sur une donnée fabriquée pour l'occasion.
 *
 * ---------------------------------------------------------------------------
 * `icon` — le repli, identique au Lot 8E (écart nº 110)
 * ---------------------------------------------------------------------------
 * La colonne est `text not null` : la base accepte n'importe quelle chaîne
 * (mesuré au Lot 8E sur `core_values.icon`, et `stats.icon` est déclarée de la
 * même façon). Lever ferait tomber l'accueil ET `/impact` sur leur frontière
 * d'erreur à cause d'un caractère de trop dans un champ décoratif. Le repli est
 * la ceinture ; le `z.enum(ICON_NAMES)` du schéma est le harnais.
 */
export function toStat(row: Tables<"stats">): Stat {
  return {
    id: row.id,
    key: row.key,
    label: row.label,
    value: row.value,
    suffix: row.suffix,
    icon: isIconName(row.icon) ? row.icon : ICON_NAME_REPLI,
    note: row.note,
    toConfirm: row.to_confirm,
    position: row.position,
    isVisible: row.is_visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Domaine → SQL, à la création. */
export function toStatInsert(input: CreateStatRow): TablesInsert<"stats"> {
  return {
    key: input.key,
    label: input.label,
    // Voir ci-dessus : pas de `?? 0`, jamais.
    value: input.value,
    suffix: input.suffix,
    icon: input.icon,
    note: input.note,
    to_confirm: input.toConfirm ?? false,
    position: input.position ?? 0,
    is_visible: input.isVisible ?? true,
  };
}

/**
 * Domaine → SQL, à la mise à jour.
 *
 * ⚠️  Seuls les champs RÉELLEMENT transmis sont inclus.
 *
 * `undefined` signifie « champ non modifié », pas « effacer ». Construire
 * l'objet en une fois écraserait de `null` tous les champs absents de la charge
 * utile — c'est le bug classique du PATCH, et il a ici deux conséquences
 * distinctes :
 *
 *   * sur `is_visible` et `to_confirm`, qui sont `not null` : PostgREST
 *     sérialise `undefined` en `null` et la base refuse l'écriture ENTIÈRE avec
 *     une erreur de contrainte incompréhensible — sur une correction de
 *     libellé ;
 *   * sur `value`, qui est nullable : l'écriture PASSERAIT, et effacerait
 *     silencieusement un chiffre que personne n'a touché.
 *
 * ⚠️  Le test est donc `!== undefined` et non un `if (input.value)` ni un
 * `!= null`. `value: 0` est une valeur légitime, `value: null` est une
 * intention explicite, et les deux doivent traverser. C'est la traduction en
 * code de l'invariant nº 1, et c'est le seul endroit où elle s'écrit.
 */
export function toStatUpdate(input: UpdateStat): TablesUpdate<"stats"> {
  const row: TablesUpdate<"stats"> = {};

  if (input.key !== undefined) row.key = input.key;
  if (input.label !== undefined) row.label = input.label;
  if (input.value !== undefined) row.value = input.value;
  if (input.suffix !== undefined) row.suffix = input.suffix;
  if (input.icon !== undefined) row.icon = input.icon;
  if (input.note !== undefined) row.note = input.note;
  if (input.toConfirm !== undefined) row.to_confirm = input.toConfirm;
  if (input.position !== undefined) row.position = input.position;
  if (input.isVisible !== undefined) row.is_visible = input.isVisible;

  return row;
}
