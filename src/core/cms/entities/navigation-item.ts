/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UNE ENTRÉE DE NAVIGATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8 du Rapport 1. Reprise de `src/lib/navigation.ts` (`mainNav`,
 * `conversionNav`, `legalNav`), désormais en base (`navigation_items`,
 * migration 0007) et augmentée d'un quatrième menu, `footer`, que le code
 * statique ne distinguait pas de `legal`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `position` EST RELATIVE AU MENU, PAS GLOBALE
 * ---------------------------------------------------------------------------
 * `core_values.position` (Lot 8E) numérote UNE liste. Celle-ci numérote
 * QUATRE listes indépendantes dans la même table — l'index
 * `(menu, position)` de la migration 0007 le dit. `reorder_rows()` (§3.4)
 * l'ignore : il renumérote les identifiants reçus de 1 à N sans notion de
 * menu. C'est au cas d'usage `reorder-navigation-items.ts` de garantir que la
 * liste transmise est bien celle d'UN SEUL menu — même piège, même parade
 * que `reorderSections` au Lot 9 avec les pages.
 *
 * ---------------------------------------------------------------------------
 * `parentId` EXISTE EN BASE, ET N'EST PAS EXPLOITÉ PAR CE LOT
 * ---------------------------------------------------------------------------
 * Aucun des trois menus migrés n'a de sous-entrée : `mainNav`, `conversionNav`
 * et `legalNav` sont des listes plates. Le champ est conservé dans l'entité
 * (la colonne existe, l'ignorer serait mentir sur la forme des données) mais
 * aucun écran de ce lot ne propose de choisir un parent — ce sera au lot qui
 * introduira réellement des menus déroulants de le faire.
 */

/** Les quatre menus que la base accepte (migration 0007). */
export const NAVIGATION_MENUS = ["main", "conversion", "legal", "footer"] as const;

export type NavigationMenu = (typeof NAVIGATION_MENUS)[number];

/**
 * `navigation_items.menu` est un `text check (menu in (...))` (migration
 * 0007), pas une énumération PostgreSQL native : `database.types.ts` le
 * génère donc en `string`, pas en union. Même situation que `IconName`
 * (écart du Lot 8E) : le mapper Supabase (`navigation-item.mapper.ts`) a
 * besoin d'un pont entre les deux, avec un repli qui ne peut JAMAIS être
 * atteint par une écriture de ce projet — `create-navigation-item.ts` et la
 * contrainte SQL empêchent tous deux qu'une valeur hors liste soit un jour
 * écrite. Il ne protège qu'une ligne modifiée à la main dans le SQL Editor.
 */
export function isNavigationMenu(valeur: unknown): valeur is NavigationMenu {
  return (
    typeof valeur === "string" &&
    (NAVIGATION_MENUS as readonly string[]).includes(valeur)
  );
}

/** Repli si une ligne portait un menu hors liste — le moins visible des quatre. */
export const NAVIGATION_MENU_REPLI: NavigationMenu = "footer";

export type NavigationItem = {
  id: string;
  menu: NavigationMenu;
  label: string;
  href: string;
  description: string | null;
  parentId: string | null;
  position: number;
  /** Un lien externe s'ouvre dans un nouvel onglet, `rel="noopener"`. */
  isExternal: boolean;
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Champs saisis à la création. `position` est calculée, pas décidée.
 *
 * `isExternal` et `isVisible` restent facultatifs — comme `CreateCoreValue`
 * (§8E) et pour la même raison : le cas d'usage leur donne un défaut
 * (`false`, `true`), et un appelant qui ne passe pas par le schéma Zod de
 * création (un test, un futur importateur) doit pouvoir s'en dispenser sans
 * que le type le lui interdise.
 */
export type CreateNavigationItem = Omit<
  NavigationItem,
  "id" | "createdAt" | "updatedAt" | "position" | "isExternal" | "isVisible" | "parentId"
> & {
  position?: number;
  isExternal?: boolean;
  isVisible?: boolean;
  /** Facultatif comme les deux précédents : aucun appelant n'en fixe un aujourd'hui. */
  parentId?: string | null;
};

/** Modification partielle. `id` et `menu` désignent la cible, jamais saisis. */
export type UpdateNavigationItem = Partial<
  Omit<NavigationItem, "id" | "createdAt" | "updatedAt" | "menu">
>;
