import type {
  CoreValue,
  CreateCoreValue,
  UpdateCoreValue,
} from "@/core/cms/entities/core-value";
import { ICON_NAME_REPLI, isIconName } from "@/core/cms/entities/icon-name";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  C'est le SEUL endroit du dépôt où l'on passe de `snake_case` à
 * `camelCase`. Aucun composant, aucun cas d'usage, aucune page ne doit jamais
 * voir `is_visible`.
 */

/**
 * SQL → domaine.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA SEULE CONVERSION NON TRIVIALE DES CINQ MAPPERS ÉCRITS : `icon`
 * ---------------------------------------------------------------------------
 * La colonne est `text not null` — la base accepte n'importe quelle chaîne.
 * L'entité, elle, déclare `icon: IconName`. Le mapper est donc l'endroit exact
 * où l'écart se règle, et il n'y a que deux façons de le faire :
 *
 *   1. **Lever.** Une ligne portant une icône inconnue rendrait toute la
 *      collection illisible — l'accueil ET « Qui sommes-nous » tomberaient sur
 *      leur frontière d'erreur, à cause d'un caractère de trop dans un champ
 *      décoratif. Disproportionné.
 *   2. **Replier sur `Sparkles`**, et c'est ce qui est fait.
 *
 * Le repli ne masque rien d'important : `<ContentIcon>` fait déjà exactement le
 * même choix au rendu depuis le Lot 8A, et l'icône n'est jamais porteuse
 * d'information — elle accompagne un titre qui, lui, est lisible.
 *
 * ⚠️  Ce que le repli NE fait pas, et qu'il ne faut pas croire : il ne
 * « nettoie » pas la base. La ligne garde sa valeur invalide, qui reviendra au
 * prochain chargement. La seule chose qui empêche VRAIMENT une icône inconnue
 * d'entrer est le `z.enum(ICON_NAMES)` du schéma, en amont. Le repli est la
 * ceinture ; le schéma est le harnais.
 */
export function toCoreValue(row: Tables<"core_values">): CoreValue {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    icon: isIconName(row.icon) ? row.icon : ICON_NAME_REPLI,
    tone: row.tone,
    position: row.position,
    isVisible: row.is_visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Domaine → SQL, à la création. */
export function toCoreValueInsert(
  input: CreateCoreValue,
): TablesInsert<"core_values"> {
  return {
    title: input.title,
    description: input.description,
    icon: input.icon,
    tone: input.tone,
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
 * utile — c'est le bug classique du PATCH.
 *
 * Il a ici une conséquence particulière : `is_visible` est `not null`. Un objet
 * construit d'un bloc y placerait `undefined`, que PostgREST sérialise en
 * `null`, et la base refuserait l'écriture entière avec une erreur de
 * contrainte incompréhensible — sur une modification de titre.
 */
export function toCoreValueUpdate(
  input: UpdateCoreValue,
): TablesUpdate<"core_values"> {
  const row: TablesUpdate<"core_values"> = {};

  if (input.title !== undefined) row.title = input.title;
  if (input.description !== undefined) row.description = input.description;
  if (input.icon !== undefined) row.icon = input.icon;
  if (input.tone !== undefined) row.tone = input.tone;
  if (input.position !== undefined) row.position = input.position;
  if (input.isVisible !== undefined) row.is_visible = input.isVisible;

  return row;
}
