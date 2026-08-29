import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE CONTRAT DU `<DataTable>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §6.1 du Rapport 2. Les colonnes sont DÉCLARÉES, jamais codées en dur : c'est
 * ce qui permet aux neuf collections du Lot 8 de partager un seul écran de
 * liste au lieu d'en écrire neuf.
 *
 * Trois ajouts au type du rapport sont signalés en place ci-dessous
 * (`sortValue`, `FilterDescriptor`, `selection.actions`). Chacun comble un
 * manque qui rendait la fonctionnalité annoncée inatteignable.
 */

export type Column<T> = {
  key: string;
  header: string;
  cell: (row: T) => ReactNode;
  sortable?: boolean;
  /**
   * ✚ AJOUT AU TYPE DU §6.1 — sans lui, `sortable` ne peut pas fonctionner.
   *
   * `cell` renvoie un `ReactNode` : un `<span>` avec une pastille de statut,
   * une date formatée, un lien. Rien de tout cela ne se compare. Trier exige
   * donc une valeur BRUTE, distincte de son rendu.
   *
   * À défaut, la colonne retombe sur `row[key]` converti en chaîne — ce qui
   * marche pour un titre, et donne un ordre absurde pour une date au format
   * français. Déclarer `sortValue` sur toute colonne triable non textuelle.
   */
  sortValue?: (row: T) => string | number | Date | null | undefined;
  width?: string;
  /**
   * Masquée entre 768 et 1024 px.
   *
   * ⚠️  Sous 768 px, la question ne se pose plus : la structure de tableau
   * n'est pas rendue du tout, ce sont des cartes. Voir `card-view.tsx`.
   */
  hideOnMobile?: boolean;
  /** Aligne la colonne à droite — nombres, dates, actions. */
  align?: "start" | "end";
};

/**
 * ✚ TYPE ABSENT DU §6.1, qui le référence sans le définir.
 *
 * `match` est fourni par l'appelant plutôt que déduit d'une clé : un filtre
 * « statut » compare une énumération, un filtre « catégorie » cherche dans un
 * tableau d'identifiants. Une seule signature couvre les deux, et le
 * `<DataTable>` n'a rien à savoir de la forme des données.
 */
export type FilterDescriptor<T> = {
  key: string;
  label: string;
  options: { value: string; label: string }[];
  match: (row: T, value: string) => boolean;
};

export type RowAction = {
  label: string;
  icon?: LucideIcon;
  onSelect: () => void;
  variant?: "default" | "destructive";
  disabled?: boolean;
  /** Explique la désactivation plutôt que de laisser l'entrée muette. */
  disabledReason?: string;
};

export type BulkAction = {
  key: string;
  label: string;
  icon?: LucideIcon;
  variant?: "default" | "destructive";
};

export type EmptyStateDescriptor = {
  title: string;
  description: string;
  action?: ReactNode;
};

export type DataTableProps<T> = {
  data: T[];
  columns: Column<T>[];
  getRowId: (row: T) => string;
  /**
   * Colonne qui identifie la ligne — titre de la carte sous 768 px.
   *
   * Par défaut la première colonne déclarée. À préciser quand la première
   * colonne est une case à cocher ou une vignette.
   */
  primaryColumnKey?: string;
  /**
   * ✚ Colonne affichée à droite du titre sur la carte mobile.
   *
   * Le §6.1 décrit la ligne 1 d'une carte comme « colonne primaire (titre) +
   * `<StatusBadge>` », sans dire d'où vient le badge. Le nommer explicitement
   * vaut mieux que de deviner : par défaut, la colonne de clé `status` si elle
   * existe, sinon rien — et les métadonnées de la ligne 2 restent inchangées.
   */
  badgeColumnKey?: string;
  isLoading?: boolean;
  error?: string;
  onRetry?: () => void;
  emptyState: EmptyStateDescriptor;
  search?: { placeholder: string; keys: (keyof T)[] };
  filters?: FilterDescriptor<T>[];
  pagination?: { pageSize: number };
  /**
   * ✚ `actions` AJOUTÉ au type du §6.1 : sans la liste des actions
   * disponibles, la barre de sélection multiple n'a aucun bouton à afficher.
   */
  selection?: {
    actions: BulkAction[];
    onBulk: (ids: string[], action: BulkAction) => void;
  };
  reorder?: { onReorder: (orderedIds: string[]) => Promise<void> };
  rowActions?: (row: T) => RowAction[];
  /** Libellé de l'unité listée : « programme », « article ». */
  itemLabel?: string;
};

export type SensDeTri = "asc" | "desc";

export type EtatDeTri = { key: string; sens: SensDeTri } | null;
