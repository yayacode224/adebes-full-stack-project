import type { ListFilter } from "../../shared/pagination";
import type {
  CoreValue,
  CreateCoreValue,
  UpdateCoreValue,
} from "../entities/core-value";

/**
 * Ports de la valeur — la frontière entre le domaine et la persistance.
 *
 * Même découpage lecture / écriture qu'aux Lots 8A à 8D (principe I de
 * SOLID) : une lecture publique reçoit un `CoreValueReadPort` et rien d'autre.
 * Elle ne peut pas écrire — pas par convention, mais parce que le type ne le
 * permet pas.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `findVisible`, ET NON `findPublished`
 * ---------------------------------------------------------------------------
 * La nuance n'est pas cosmétique. Les quatre collections précédentes
 * demandaient « ce qui est PUBLIÉ », c'est-à-dire l'issue d'un cycle éditorial
 * à quatre états. Celle-ci demande « ce qui est AFFICHÉ », un booléen.
 *
 * Garder le nom `findPublished` aurait laissé croire à un `status` absent, et
 * la première personne à écrire un filtre serait allée chercher une colonne qui
 * n'existe pas. Le vocabulaire du port suit celui de la table.
 *
 * ---------------------------------------------------------------------------
 * `setVisibility` PLUTÔT QU'UN `update({ isVisible })`
 * ---------------------------------------------------------------------------
 * Une méthode dédiée, comme `setStatus` ailleurs, alors même que `update`
 * saurait le faire. C'est délibéré, et c'est la raison qui vaut aussi pour les
 * autres collections : **afficher ou retirer du site est une intention
 * distincte de corriger un texte.** Elle mérite son cas d'usage, son entrée
 * d'audit et son libellé de bouton.
 *
 * Elle ne mérite pas, ici, une permission distincte : `value:publish` n'existe
 * pas dans la matrice. C'est `value:update` qui la couvre. Voir
 * `set-core-value-visibility.ts`.
 */

export interface CoreValueReadPort {
  findAll(filter?: ListFilter): Promise<CoreValue[]>;
  findById(id: string): Promise<CoreValue | null>;
  count(filter?: ListFilter): Promise<number>;
  /**
   * Les valeurs affichées, dans l'ordre.
   *
   * Séparé de `findAll` pour la même raison qu'aux quatre lots précédents : la
   * règle d'affichage public est UNE règle, et elle vit dans le dépôt plutôt
   * que d'être recopiée par chaque appelant. Elle en a ici deux — l'accueil et
   * « Qui sommes-nous » — ce qui rend la recopie d'autant plus tentante.
   */
  findVisible(limit?: number): Promise<CoreValue[]>;
}

export interface CoreValueWritePort {
  create(input: CreateCoreValue): Promise<CoreValue>;
  update(id: string, input: UpdateCoreValue): Promise<CoreValue>;
  delete(id: string): Promise<void>;
  /** Réordonne en UNE transaction — `reorder_rows()` en RPC (§3.4). */
  reorder(orderedIds: string[]): Promise<void>;
  setVisibility(id: string, isVisible: boolean): Promise<CoreValue>;
}

/**
 * Regroupement de confort pour les cas d'usage qui écrivent.
 *
 * Deux champs, comme `TeamMemberDeps` : `core_values` n'a AUCUNE clé étrangère,
 * ni sortante ni entrante. C'est la table la plus isolée du schéma — pas même
 * un média à rattacher. Rien n'est donc à vérifier ailleurs avant d'écrire, et
 * rien ne peut casser en supprimant.
 */
export type CoreValueDeps = {
  read: CoreValueReadPort;
  write: CoreValueWritePort;
};
