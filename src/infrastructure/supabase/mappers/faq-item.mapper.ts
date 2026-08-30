import {
  isFaqTopic,
  type CreateFaqItem,
  type FaqItem,
  type UpdateFaqItem,
} from "@/core/cms/entities/faq-item";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  C'est le SEUL endroit du dépôt où l'on passe de `snake_case` à
 * `camelCase`. Aucun composant, aucun cas d'usage, aucune page ne doit jamais
 * voir `created_at`.
 *
 * ---------------------------------------------------------------------------
 * DEUX CONVERSIONS NON TRIVIALES, ET ELLES N'ONT PAS LE MÊME STATUT
 * ---------------------------------------------------------------------------
 *
 * **1. `topic` — un repli qui ne devrait jamais servir.**
 *
 * La colonne est typée `string` par `database.types.ts` : le générateur ne sait
 * pas lire une contrainte `check`, il ne voit qu'un `text`. Le domaine, lui,
 * exige un `FaqTopic`. Il faut donc convertir.
 *
 * La différence avec le repli d'icône du Lot 8E (écart nº 110) est réelle et
 * mérite d'être écrite : là-bas la colonne était un `text` LIBRE, et une valeur
 * invalide était réellement insérable — la recette du Lot 8E l'a mesuré. Ici,
 * `check (topic in ('don', 'benevolat', 'general'))` (migration 0005) refuse
 * l'insertion. Le repli ci-dessous est donc une conséquence du typage, pas une
 * défense contre un cas atteignable, et la recette de ce lot vérifie
 * précisément qu'il ne l'est pas.
 *
 * Il reste préférable à un `as FaqTopic`, qui mentirait au compilateur : le
 * jour où une migration élargirait la contrainte sans que le domaine suive,
 * l'assertion produirait un `topic` inconnu circulant partout, là où le repli
 * range la question dans « Général » — visible, corrigeable, sans page cassée.
 *
 * **2. `bullets` — une normalisation, pas un repli.**
 *
 * La colonne est `text[] not null default '{}'`. En pratique elle est toujours
 * un tableau ; `?? []` couvre le cas d'une lecture partielle et garantit
 * l'invariant de l'entité : `bullets` est un tableau, jamais `null`. C'est ce
 * qui permet à `<FAQAccordion>` de ne traiter qu'un seul état d'absence.
 */

/** SQL → domaine. */
export function toFaqItem(row: Tables<"faq_items">): FaqItem {
  return {
    id: row.id,
    question: row.question,
    answer: row.answer,
    bullets: row.bullets ?? [],
    topic: isFaqTopic(row.topic) ? row.topic : "general",
    position: row.position,
    status: row.status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Domaine → SQL, à la création. */
export function toFaqItemInsert(input: CreateFaqItem): TablesInsert<"faq_items"> {
  return {
    question: input.question,
    answer: input.answer,
    bullets: input.bullets ?? [],
    topic: input.topic,
    position: input.position ?? 0,
    status: input.status ?? "draft",
  };
}

/**
 * Domaine → SQL, à la mise à jour.
 *
 * ⚠️  Seuls les champs RÉELLEMENT transmis sont inclus.
 *
 * `undefined` signifie « champ non modifié », pas « effacer ». Construire
 * l'objet en une fois écraserait de `null` tous les champs absents de la charge
 * utile — c'est le bug classique du PATCH, et il se traduirait ici par des
 * puces qui disparaissent parce qu'on a corrigé une faute dans la question.
 *
 * ⚠️  Un tableau VIDE, lui, passe et doit passer : `bullets: []` est la façon
 * de retirer toutes les puces d'une réponse. C'est la différence entre `[]` et
 * `undefined`, et elle est le seul moyen d'exprimer « il n'y en a plus ».
 */
export function toFaqItemUpdate(input: UpdateFaqItem): TablesUpdate<"faq_items"> {
  const row: TablesUpdate<"faq_items"> = {};

  if (input.question !== undefined) row.question = input.question;
  if (input.answer !== undefined) row.answer = input.answer;
  if (input.bullets !== undefined) row.bullets = input.bullets;
  if (input.topic !== undefined) row.topic = input.topic;
  if (input.position !== undefined) row.position = input.position;
  if (input.status !== undefined) row.status = input.status;

  return row;
}
