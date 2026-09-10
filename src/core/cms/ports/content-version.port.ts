import type {
  ContentVersion,
  CreateContentVersion,
  VersionedEntityType,
} from "../entities/content-version";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PORTS DE L'HISTORIQUE DE CONTENU (§12.2 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Même découpage lecture / écriture que toute la série 8. Un écran d'historique
 * reçoit un `ContentVersionReadPort` et rien d'autre : il liste et compare, il
 * ne crée ni ne purge.
 *
 * La restauration proprement dite n'est PAS ici : remettre un instantané en
 * place, c'est réécrire l'entité cible (un `Article`, une `Page`), ce qui passe
 * par le port de CETTE entité. Ce port-ci ne sait que lire l'historique et y
 * ajouter une ligne.
 */

export interface ContentVersionReadPort {
  /** L'historique d'une entité, de la version la plus récente à la plus ancienne. */
  listForEntity(
    entityType: VersionedEntityType,
    entityId: string,
  ): Promise<ContentVersion[]>;

  /** Une version précise, par son identifiant. `null` si elle n'existe plus. */
  findById(id: string): Promise<ContentVersion | null>;
}

export interface ContentVersionWritePort {
  /**
   * Ajoute un instantané.
   *
   * Le dépôt calcule `versionNumber` (dernier + 1) dans la même opération : le
   * laisser à l'appelant ouvrirait une course entre deux publications
   * simultanées, que la contrainte d'unicité
   * `(entity_type, entity_id, version_number)` transformerait en erreur.
   */
  record(input: CreateContentVersion): Promise<ContentVersion>;

  /**
   * Ne garde que les `keep` versions les plus récentes d'une entité, supprime
   * le reste. Renvoie le nombre de lignes supprimées.
   *
   * Appelé juste après `record`, dans le même cas d'usage : la rétention est
   * une règle de l'historique, pas une tâche de maintenance différée.
   */
  pruneToLast(
    entityType: VersionedEntityType,
    entityId: string,
    keep: number,
  ): Promise<number>;
}

/** Regroupement de confort pour le cas d'usage qui enregistre une version. */
export type ContentVersionDeps = {
  read: ContentVersionReadPort;
  write: ContentVersionWritePort;
};
