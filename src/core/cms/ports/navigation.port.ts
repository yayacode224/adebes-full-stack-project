import type {
  CreateNavigationItem,
  NavigationItem,
  NavigationMenu,
  UpdateNavigationItem,
} from "../entities/navigation-item";

/**
 * Ports de la navigation — §10 du Rapport 2.
 *
 * Même découpage lecture / écriture que les collections du Lot 8.
 *
 * ---------------------------------------------------------------------------
 * `findByMenu`, ET NON `findAll` SUIVI D'UN FILTRE EN MÉMOIRE
 * ---------------------------------------------------------------------------
 * Chaque écran de dashboard affiche UN menu (§10.1). Un `findAll()` suivi d'un
 * filtre `Array.prototype.filter` fonctionnerait aussi bien sur douze lignes,
 * mais il porterait une hypothèse fausse au premier appelant qui l'imiterait
 * sur une table plus grande : que « lire tout puis filtrer côté serveur
 * Node » est le bon défaut. Le filtre voyage donc jusqu'à PostgREST.
 */
export interface NavigationReadPort {
  findByMenu(menu: NavigationMenu): Promise<NavigationItem[]>;
  /**
   * Les entrées affichées d'UN menu, dans l'ordre — ce que lit le site
   * public (`server/queries/navigation.query.ts`). Séparée de `findByMenu`
   * pour la même raison qu'aux collections du Lot 8 (`findVisible`,
   * `findPublished`, …) : la règle d'affichage public est UNE règle, elle vit
   * dans le dépôt plutôt que d'être recopiée par chaque appelant — ici, par
   * quatre appelants (l'en-tête, le pied de page, `/mentions-legales`, la
   * page « Faire un don »/« Devenir bénévole »).
   */
  findVisibleByMenu(menu: NavigationMenu): Promise<NavigationItem[]>;
  findById(id: string): Promise<NavigationItem | null>;
}

export interface NavigationWritePort {
  create(input: CreateNavigationItem): Promise<NavigationItem>;
  update(id: string, input: UpdateNavigationItem): Promise<NavigationItem>;
  delete(id: string): Promise<void>;
  /** Réordonne EN UNE transaction — `reorder_rows()` (§3.4), un menu à la fois. */
  reorder(orderedIds: string[]): Promise<void>;
  setVisibility(id: string, isVisible: boolean): Promise<NavigationItem>;
}

export type NavigationDeps = {
  read: NavigationReadPort;
  write: NavigationWritePort;
};
