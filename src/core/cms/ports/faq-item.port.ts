import type { ListFilter } from "../../shared/pagination";
import type { ContentStatus } from "../entities/content-status";
import type {
  CreateFaqItem,
  FaqItem,
  FaqTopic,
  UpdateFaqItem,
} from "../entities/faq-item";

/**
 * Ports de la question fréquente — la frontière entre le domaine et la
 * persistance.
 *
 * Même découpage lecture / écriture qu'aux Lots 8A à 8E (principe I de
 * SOLID) : une lecture publique reçoit un `FaqItemReadPort` et rien d'autre.
 * Elle ne peut pas écrire — pas par convention, mais parce que le type ne le
 * permet pas.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE CLÉ ÉTRANGÈRE, DANS AUCUN SENS
 * ---------------------------------------------------------------------------
 * `faq_items` ne référence rien — pas même un média — et rien ne la
 * référence. Il n'y a donc ni `findBySlug` (pas de page dédiée), ni
 * `countByX` (personne à prévenir avant une suppression), ni port étranger
 * dans `FaqItemDeps`. C'est, avec `core_values`, la table la plus isolée du
 * schéma.
 *
 * `reorder` est bien là : `faq_items` porte une colonne `position`
 * (migration 0005) et figure dans la liste blanche de `reorder_rows`
 * (migration 0012).
 */

export interface FaqItemReadPort {
  findAll(filter?: ListFilter): Promise<FaqItem[]>;
  findById(id: string): Promise<FaqItem | null>;
  count(filter?: ListFilter): Promise<number>;
  /**
   * Les questions publiées, dans l'ordre d'affichage.
   *
   * ---------------------------------------------------------------------------
   * ⚠️  LE FILTRE PAR SUJET EST DANS LE PORT, PAS DANS L'APPELANT
   * ---------------------------------------------------------------------------
   * C'est la première lecture publique du Lot 8 qui prend un paramètre de
   * sélection. La raison est que le sujet DÉCIDE de la page : « Faire un don »
   * n'affiche pas une sous-partie de la FAQ, elle affiche la FAQ des dons.
   * Laisser chaque page rapatrier les sept lignes puis filtrer en mémoire
   * aurait recopié la même condition dans trois fichiers, et rendu inutile
   * l'index `faq_items_topic_position_idx` posé par la migration 0005.
   *
   * `topic` absent = tous les sujets. C'est ce dont l'accueil a besoin : sa
   * règle n'est pas « un sujet » mais « tous SAUF le bénévolat », qu'aucun
   * `eq` ne peut exprimer — elle est appliquée par `selectionAccueil()`, dans
   * le domaine.
   */
  findPublished(options?: { topic?: FaqTopic; limit?: number }): Promise<FaqItem[]>;
}

export interface FaqItemWritePort {
  create(input: CreateFaqItem): Promise<FaqItem>;
  update(id: string, input: UpdateFaqItem): Promise<FaqItem>;
  delete(id: string): Promise<void>;
  /** Réordonne en UNE transaction — `reorder_rows()` en RPC (§3.4). */
  reorder(orderedIds: string[]): Promise<void>;
  setStatus(id: string, status: ContentStatus): Promise<FaqItem>;
}

/**
 * Regroupement de confort pour les cas d'usage qui écrivent.
 *
 * Deux champs seulement, comme `TeamMemberDeps` : aucun identifiant étranger
 * n'est à vérifier avant d'écrire.
 */
export type FaqItemDeps = {
  read: FaqItemReadPort;
  write: FaqItemWritePort;
};
