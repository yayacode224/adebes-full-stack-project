import type {
  CreateNavigationItem,
  NavigationItem,
  UpdateNavigationItem,
} from "@/core/cms/entities/navigation-item";
import {
  NAVIGATION_MENU_REPLI,
  isNavigationMenu,
} from "@/core/cms/entities/navigation-item";

import type { Tables, TablesInsert, TablesUpdate } from "../database.types";

/**
 * Conversion entre la ligne SQL et l'entité de domaine.
 *
 * ⚠️  `menu` suit le même traitement que `icon` sur `core_value.mapper.ts`
 * (écart du Lot 8E) : la colonne est `text check (...)`, pas une énumération
 * native, donc `string` côté généré. Voir `isNavigationMenu` pour la raison
 * du repli — il ne peut être atteint que par une ligne modifiée à la main.
 */
export function toNavigationItem(row: Tables<"navigation_items">): NavigationItem {
  return {
    id: row.id,
    menu: isNavigationMenu(row.menu) ? row.menu : NAVIGATION_MENU_REPLI,
    label: row.label,
    href: row.href,
    description: row.description,
    parentId: row.parent_id,
    position: row.position,
    isExternal: row.is_external,
    isVisible: row.is_visible,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/** Domaine → SQL, à la création. */
export function toNavigationItemInsert(
  input: CreateNavigationItem,
): TablesInsert<"navigation_items"> {
  return {
    menu: input.menu,
    label: input.label,
    href: input.href,
    description: input.description,
    position: input.position ?? 0,
    is_external: input.isExternal ?? false,
    is_visible: input.isVisible ?? true,
  };
}

/**
 * Domaine → SQL, à la mise à jour.
 *
 * Seuls les champs réellement transmis sont inclus — même règle que
 * `toCoreValueUpdate` (§8E) : `is_external` et `is_visible` sont `not null`,
 * un objet construit d'un bloc y placerait `undefined` pour un champ absent
 * de la charge utile, que PostgREST sérialise en `null` et que la base
 * refuse.
 */
export function toNavigationItemUpdate(
  input: UpdateNavigationItem,
): TablesUpdate<"navigation_items"> {
  const row: TablesUpdate<"navigation_items"> = {};

  if (input.label !== undefined) row.label = input.label;
  if (input.href !== undefined) row.href = input.href;
  if (input.description !== undefined) row.description = input.description;
  if (input.position !== undefined) row.position = input.position;
  if (input.isExternal !== undefined) row.is_external = input.isExternal;
  if (input.isVisible !== undefined) row.is_visible = input.isVisible;

  return row;
}
