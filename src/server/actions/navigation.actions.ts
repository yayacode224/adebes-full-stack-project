"use server";

import type { NavigationItem } from "@/core/cms/entities/navigation-item";
import {
  createNavigationItemSchema,
  navigationItemIdSchema,
  reorderNavigationItemsSchema,
  setNavigationItemVisibilitySchema,
  updateNavigationItemSchema,
} from "@/core/cms/schemas/navigation-item.schema";
import { createNavigationItem } from "@/core/use-cases/navigation/create-navigation-item";
import { deleteNavigationItem } from "@/core/use-cases/navigation/delete-navigation-item";
import { reorderNavigationItems } from "@/core/use-cases/navigation/reorder-navigation-items";
import { setNavigationItemVisibility } from "@/core/use-cases/navigation/set-navigation-item-visibility";
import { updateNavigationItem } from "@/core/use-cases/navigation/update-navigation-item";

import { createAction } from "../action-kit/create-action";
import { navigationDeps } from "../deps/navigation.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DE LA NAVIGATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10 du Rapport 2, gabarit de `values.actions.ts` (§8E). Cinq actions —
 * création, modification, visibilité, réordonnancement, suppression.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'ÉTIQUETTE DE CACHE SE LIT SUR LE RÉSULTAT, PAS SUR L'ENTRÉE
 * ---------------------------------------------------------------------------
 * `cms:navigation:<menu>` (§11 du Rapport 1) est propre à CHAQUE menu.
 * `modifierEntreeAction`, `changerVisibiliteEntreeAction` et
 * `supprimerEntreeAction` ne reçoivent qu'un `id` en entrée — le menu n'y
 * figure pas, par construction (`updateNavigationItemSchema` l'exclut, voir
 * `navigation-item.schema.ts`). C'est donc le RÉSULTAT du cas d'usage, qui
 * porte toujours `menu`, qui fournit l'étiquette à invalider. Pour la
 * suppression, dont le résultat ne serait normalement qu'un identifiant, le
 * menu est explicitement remonté par le handler pour cette seule raison.
 *
 * ---------------------------------------------------------------------------
 * QUATRE PERMISSIONS DISTINCTES, TOUTES ABSENTES DE `editor`
 * ---------------------------------------------------------------------------
 * `navigation:create/update/delete/reorder` n'apparaissent sur AUCUNE liste
 * `editor` (`core/rbac/permissions.ts`) : contrairement aux collections du
 * Lot 8, il n'existe ici aucun geste ouvert à ce rôle. La RLS le confirme —
 * les quatre politiques `navigation_items_admin_*` exigent toutes
 * `app_can_publish()`.
 */

const etiquetteMenu = (item: NavigationItem) => [`cms:navigation:${item.menu}`];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

export const creerEntreeNavigationAction = createAction<
  typeof createNavigationItemSchema,
  NavigationItem
>({
  permission: "navigation:create",
  input: createNavigationItemSchema,
  audit: {
    action: "navigation_item.create",
    entityType: "navigation_item",
    entityId: (item) => item.id,
  },
  invalidates: etiquetteMenu,
  handler: async ({ input }) => createNavigationItem(await navigationDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

export const modifierEntreeNavigationAction = createAction<
  typeof updateNavigationItemSchema,
  NavigationItem
>({
  permission: "navigation:update",
  input: updateNavigationItemSchema,
  audit: {
    action: "navigation_item.update",
    entityType: "navigation_item",
    entityId: (item) => item.id,
  },
  invalidates: etiquetteMenu,
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateNavigationItem(await navigationDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Affichage dans le menu
 * ═══════════════════════════════════════════════════════════════════════════ */

export const changerVisibiliteEntreeNavigationAction = createAction<
  typeof setNavigationItemVisibilitySchema,
  NavigationItem
>({
  permission: "navigation:update",
  input: setNavigationItemVisibilitySchema,
  audit: {
    action: "navigation_item.visibility",
    entityType: "navigation_item",
    entityId: (item) => item.id,
  },
  invalidates: etiquetteMenu,
  handler: async ({ input }) =>
    setNavigationItemVisibility(await navigationDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement
 * ═══════════════════════════════════════════════════════════════════════════ */

export const reordonnerNavigationAction = createAction<
  typeof reorderNavigationItemsSchema,
  { count: number; menu: string }
>({
  permission: "navigation:reorder",
  input: reorderNavigationItemsSchema,
  audit: { action: "navigation_item.reorder", entityType: "navigation_item" },
  invalidates: (resultat) => [`cms:navigation:${resultat.menu}`],
  handler: async ({ input }) => {
    const resultat = await reorderNavigationItems(await navigationDeps(), input);
    return resultat.ok
      ? {
          ok: true as const,
          value: { count: input.orderedIds.length, menu: input.menu },
        }
      : resultat;
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Suppression
 * ═══════════════════════════════════════════════════════════════════════════ */

export const supprimerEntreeNavigationAction = createAction<
  typeof navigationItemIdSchema,
  { id: string; label: string; menu: string }
>({
  permission: "navigation:delete",
  input: navigationItemIdSchema,
  audit: {
    action: "navigation_item.delete",
    entityType: "navigation_item",
    entityId: (resultat) => resultat.id,
  },
  invalidates: (resultat) => [`cms:navigation:${resultat.menu}`],
  handler: async ({ input }) => {
    const deps = await navigationDeps();

    // Lus AVANT la suppression : après, l'entrée n'existe plus, et
    // l'étiquette de cache comme le message de confirmation ne pourraient
    // plus nommer le menu ni le libellé qui viennent de disparaître.
    const existante = await deps.read.findById(input.id);
    const label = existante?.label ?? "";
    const menu = existante?.menu ?? "main";

    const resultat = await deleteNavigationItem(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, label, menu } }
      : resultat;
  },
});
