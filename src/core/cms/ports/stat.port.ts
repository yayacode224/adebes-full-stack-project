import type { ListFilter } from "../../shared/pagination";
import type { CreateStatRow, Stat, UpdateStat } from "../entities/stat";

/**
 * Ports du chiffre clé — la frontière entre le domaine et la persistance.
 *
 * Même découpage lecture / écriture qu'aux Lots 8A à 8F (principe I de
 * SOLID) : une lecture publique reçoit un `StatReadPort` et rien d'autre. Elle
 * ne peut pas écrire — pas par convention, mais parce que le type ne le permet
 * pas.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `findVisible`, ET NON `findPublished` — c'est le vocabulaire du Lot 8E
 * ---------------------------------------------------------------------------
 * `stats` porte `is_visible`, pas `status` : c'est, avec `core_values`, l'une
 * des deux « listes structurantes » du §9 du Rapport 1. Le vocabulaire du port
 * suit celui de la table, sans quoi la première personne à écrire un filtre
 * irait chercher une colonne qui n'existe pas.
 *
 * ---------------------------------------------------------------------------
 * `findByKey` — LA SEULE MÉTHODE QUE `CoreValuePort` N'A PAS
 * ---------------------------------------------------------------------------
 * `stats.key` est `not null unique`. `createStat` dérive la clé du libellé et
 * doit pouvoir dire « ce libellé est déjà pris » AVANT que la base ne réponde
 * « duplicate key value violates unique constraint "stats_key_key" ».
 *
 * C'est exactement le rôle de `findBySlug` au Lot 8A, à une différence près :
 * la clé n'est pas une adresse, elle ne sert à atteindre aucune page. Elle ne
 * figure donc dans aucun autre appel que celui-ci.
 */

export interface StatReadPort {
  findAll(filter?: ListFilter): Promise<Stat[]>;
  findById(id: string): Promise<Stat | null>;
  /** Contrôle d'unicité de la clé technique — appelé à la création seulement. */
  findByKey(key: string): Promise<Stat | null>;
  count(filter?: ListFilter): Promise<number>;
  /**
   * Les chiffres affichés, dans l'ordre.
   *
   * Séparé de `findAll` pour la même raison qu'aux cinq lots précédents : la
   * règle d'affichage public est UNE règle, et elle vit dans le dépôt plutôt
   * que d'être recopiée par chaque appelant. Elle en a ici deux — l'accueil et
   * `/impact` — ce qui rend la recopie d'autant plus tentante.
   */
  findVisible(limit?: number): Promise<Stat[]>;
}

export interface StatWritePort {
  /** ⚠️  `CreateStatRow`, avec la clé : elle est calculée par `createStat`. */
  create(input: CreateStatRow): Promise<Stat>;
  update(id: string, input: UpdateStat): Promise<Stat>;
  delete(id: string): Promise<void>;
  /** Réordonne en UNE transaction — `reorder_rows()` en RPC (§3.4). */
  reorder(orderedIds: string[]): Promise<void>;
  setVisibility(id: string, isVisible: boolean): Promise<Stat>;
}

/**
 * Regroupement de confort pour les cas d'usage qui écrivent.
 *
 * Deux champs, comme `CoreValueDeps` : `stats` n'a AUCUNE clé étrangère, ni
 * sortante ni entrante — pas même un média. Rien n'est donc à vérifier ailleurs
 * avant d'écrire, et rien ne peut casser en supprimant.
 */
export type StatDeps = {
  read: StatReadPort;
  write: StatWritePort;
};
