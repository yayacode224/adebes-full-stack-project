import type { IconName } from "./icon-name";
import type { MediaTone } from "./media-tone";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UNE VALEUR DE L'ASSOCIATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reprise du type `Valeur` de `src/content/valeurs.ts`, avec les différences
 * imposées par le passage en base :
 *
 *   1. `icon` est un NOM (« HeartHandshake »), plus un composant React. Une
 *      table SQL ne stocke pas de composant. La conversion se fait au rendu,
 *      par `<ContentIcon>` — même pont qu'au Lot 8A pour les programmes.
 *   2. `position` apparaît : le tableau TypeScript avait un ordre implicite, la
 *      base le rend explicite et modifiable depuis le dashboard.
 *   3. `isVisible` apparaît, et REMPLACE le statut éditorial.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE `status` — ET CE N'EST PAS UN OUBLI
 * ---------------------------------------------------------------------------
 * C'est la première collection du Lot 8 sans cycle éditorial. La table
 * `core_values` (migration 0005) ne porte pas de colonne `status` mais un
 * booléen `is_visible`, et la matrice de permissions ne contient aucune entrée
 * `value:publish` — pour aucun rôle, super administrateur compris.
 *
 * La conséquence se propage partout et il ne faut pas la « corriger » :
 *
 *   * pas de `setStatus` dans le port d'écriture, mais `setVisibility` ;
 *   * pas de `guard_publish` (ADB01) à redouter : le trigger ne couvre que les
 *     tables à `status`. **C'est la seule barrière en MOINS de ce lot**, et
 *     elle explique pourquoi l'éditeur peut masquer une valeur alors qu'il ne
 *     peut dépublier aucun programme ;
 *   * pas de `<StatusBadge>` à l'écran, mais `<VisibilityBadge>` : deux états,
 *     pas quatre.
 *
 * Ce que dit ce choix, et qui est juste : une valeur de l'association n'est pas
 * un contenu qu'on rédige puis qu'on soumet à relecture. Elle est, ou elle
 * n'est plus. Il n'y a pas de brouillon d'un principe.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  MASQUER LA DERNIÈRE VALEUR VIDE LA SECTION DE **DEUX** PAGES
 * ---------------------------------------------------------------------------
 * C'est la première collection lue par deux pages publiques : l'accueil et
 * « Qui sommes-nous ». La section « Nos valeurs » disparaît des deux dès qu'il
 * ne reste aucune valeur visible.
 *
 * Le domaine ne l'INTERDIT pas — voir `set-core-value-visibility.ts` pour le
 * raisonnement complet. Il ne l'ignore pas non plus : l'écran le dit, avant et
 * après.
 */
export type CoreValue = {
  id: string;
  /** Le principe, en un ou deux mots : « Solidarité », « Impact social ». */
  title: string;
  /** Une phrase qui l'explique. Obligatoire : un principe sans énoncé n'en est pas un. */
  description: string;
  /**
   * Nom d'icône du registre — jamais une chaîne libre.
   *
   * Typé `IconName` et non `string`, contrairement à `Programme.icon`
   * (Lot 8A). C'est ce que permet le déplacement de la liste dans le domaine,
   * et c'est le seul endroit du projet où la garantie existe aujourd'hui.
   */
  icon: IconName;
  tone: MediaTone;
  position: number;
  /** Affichée sur le site public. Il n'y a pas d'état intermédiaire. */
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Champs saisis à la création.
 *
 * `isVisible` reste facultatif et vaut `true` par défaut — l'inverse exact de
 * `CreateTeamMember`, où `status` a été retiré du contrat pour forcer le
 * passage par la garde de publication. Ici il n'y a aucune garde à forcer : une
 * valeur qu'on vient d'écrire est une valeur qu'on veut afficher, et la base
 * dit la même chose (`is_visible boolean not null default true`).
 */
export type CreateCoreValue = Omit<
  CoreValue,
  "id" | "createdAt" | "updatedAt" | "position" | "isVisible"
> & {
  position?: number;
  isVisible?: boolean;
};

/** Modification partielle. `id` identifie la cible, il n'est jamais modifiable. */
export type UpdateCoreValue = Partial<
  Omit<CoreValue, "id" | "createdAt" | "updatedAt">
>;
