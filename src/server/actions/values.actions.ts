"use server";

import type { CoreValue } from "@/core/cms/entities/core-value";
import {
  coreValueIdSchema,
  createCoreValueSchema,
  reorderCoreValuesSchema,
  setCoreValueVisibilitySchema,
  updateCoreValueSchema,
} from "@/core/cms/schemas/core-value.schema";
import { createCoreValue } from "@/core/use-cases/core-values/create-core-value";
import { deleteCoreValue } from "@/core/use-cases/core-values/delete-core-value";
import { reorderCoreValues } from "@/core/use-cases/core-values/reorder-core-values";
import { setCoreValueVisibility } from "@/core/use-cases/core-values/set-core-value-visibility";
import { updateCoreValue } from "@/core/use-cases/core-values/update-core-value";

import { createAction } from "../action-kit/create-action";
import { coreValueDeps } from "../deps/core-value.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES VALEURS DE L'ASSOCIATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8E du Rapport 2. Les cinq passent par `createAction` — aucune exception
 * (décision D3). Une Server Action est une frontière publique : sans le
 * décorateur, `supprimerValeurAction` serait une API de suppression ouverte,
 * joignable par un POST direct sans jamais passer par le dashboard.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  TROIS ÉTIQUETTES DE CACHE — C'EST LA PREMIÈRE COLLECTION DANS CE CAS
 * ---------------------------------------------------------------------------
 * Les valeurs sont lues par DEUX pages publiques : l'accueil et « Qui
 * sommes-nous ». Les quatre collections précédentes n'en alimentaient qu'une
 * seule chacune, ou une page dédiée par entrée.
 *
 * L'oubli qui guette est facile à nommer : n'invalider que `cms:page:accueil`,
 * parce que c'est l'étiquette qu'on a sous les yeux dans les trois autres
 * fichiers d'actions. « Qui sommes-nous » garderait alors l'ancienne liste
 * jusqu'à expiration — et personne ne s'en apercevrait, puisque l'accueil,
 * lui, serait à jour.
 *
 * Les trois sont donc nommées en toutes lettres plutôt que déduites, comme
 * partout ailleurs : le jour où un bloc « valeurs » est ajouté à une troisième
 * page (Lot 9), l'oubli doit se voir ICI, à la relecture.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUNE ACTION N'EXIGE `value:publish` — CETTE PERMISSION N'EXISTE PAS
 * ---------------------------------------------------------------------------
 * `core_values` n'a pas de cycle éditorial. Afficher ou retirer une valeur du
 * site relève de `value:update`, que l'ÉDITEUR possède. Voir le raisonnement
 * complet — et l'écart de pouvoir qu'il crée avec les autres collections —
 * dans `set-core-value-visibility.ts`.
 *
 * À l'inverse, `value:create` et `value:delete` sont RÉSERVÉS aux
 * administrateurs, ce qu'aucune collection précédente ne faisait pour la
 * création. La RLS dit exactement la même chose (`core_values_admin_insert`,
 * `core_values_admin_delete` : `app_can_publish()`).
 *
 * ---------------------------------------------------------------------------
 * AUCUNE ACTION DE LECTURE ICI
 * ---------------------------------------------------------------------------
 * Comme aux quatre lots précédents : l'écran reçoit ses lignes du rendu serveur
 * et les filtre en mémoire (`<DataTable>`, §6.1).
 */

const ETIQUETTES = ["cms:valeurs", "cms:page:accueil", "cms:page:a-propos"];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Créer une valeur.
 *
 * `value:create` — **absent de la liste `editor`**. C'est la première
 * collection du Lot 8 où créer est réservé aux administrateurs, et ce n'est pas
 * une sévérité gratuite : ces quatre entrées sont la charte de l'association,
 * pas un flux de contenu. Le §9 du Rapport 1 les range avec `stat`, pour la
 * même raison.
 *
 * La valeur naît VISIBLE, contrairement aux quatre collections précédentes qui
 * naissaient en brouillon — voir `create-core-value.ts`.
 */
export const creerValeurAction = createAction<
  typeof createCoreValueSchema,
  CoreValue
>({
  permission: "value:create",
  input: createCoreValueSchema,
  audit: {
    action: "core_value.create",
    entityType: "core_value",
    entityId: (valeur) => valeur.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => createCoreValue(await coreValueDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifier une valeur.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage
 * (écart nº 20) : il désigne la cible, il n'en fait pas partie.
 *
 * La visibilité n'est pas modifiable ici — le cas d'usage la neutralise. Une
 * correction de texte ne doit pas pouvoir retirer une valeur de deux pages
 * publiques par effet de bord.
 */
export const mettreAJourValeurAction = createAction<
  typeof updateCoreValueSchema,
  CoreValue
>({
  permission: "value:update",
  input: updateCoreValueSchema,
  audit: {
    action: "core_value.update",
    entityType: "core_value",
    entityId: (valeur) => valeur.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateCoreValue(await coreValueDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Affichage sur le site
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Afficher ou retirer une valeur du site.
 *
 * ⚠️  `value:update`, et non `value:publish` : cette permission n'existe pas
 * dans la matrice. Un éditeur peut donc retirer une valeur des deux pages
 * publiques, alors qu'il ne peut dépublier aucun programme. C'est ce que
 * disent la matrice et la RLS, indépendamment l'une de l'autre ; l'écart est
 * consigné, pas corrigé au détour d'un lot de collection.
 *
 * L'entrée d'audit reste distincte de `core_value.update` — c'est une décision
 * différente, et le journal doit pouvoir répondre à « qui a retiré cette valeur
 * du site » sans qu'on la cherche parmi les corrections de texte.
 */
export const changerVisibiliteValeurAction = createAction<
  typeof setCoreValueVisibilitySchema,
  CoreValue
>({
  permission: "value:update",
  input: setCoreValueVisibilitySchema,
  audit: {
    action: "core_value.visibility",
    entityType: "core_value",
    entityId: (valeur) => valeur.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    setCoreValueVisibility(await coreValueDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Réordonner la collection.
 *
 * `value:reorder` — ouvert à l'éditeur : réordonner n'est ni créer ni
 * supprimer. La base dit la même chose (`reorder_rows` exige `app_is_staff()`).
 *
 * L'ordre se voit sur les deux pages en même temps.
 */
export const reordonnerValeursAction = createAction<
  typeof reorderCoreValuesSchema,
  { count: number }
>({
  permission: "value:reorder",
  input: reorderCoreValuesSchema,
  audit: { action: "core_value.reorder", entityType: "core_value" },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const resultat = await reorderCoreValues(
      await coreValueDeps(),
      input.orderedIds,
    );
    return resultat.ok
      ? { ok: true as const, value: { count: input.orderedIds.length } }
      : resultat;
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Suppression
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Supprimer une valeur.
 *
 * `value:delete` — administrateurs seulement, doublé par la RLS.
 *
 * Rien ne référence une valeur : la suppression n'a aucun `on delete restrict`
 * à redouter. Mais elle est DÉFINITIVE au sens plein — il n'existe pas
 * d'archive où la ranger, puisque cette collection n'a pas de statut. Masquer
 * se défait ; supprimer ne se défait pas.
 *
 * Le titre est lu AVANT la suppression : après, il n'existe plus, et le message
 * de confirmation ne pourrait plus nommer ce qui a disparu.
 */
export const supprimerValeurAction = createAction<
  typeof coreValueIdSchema,
  { id: string; title: string }
>({
  permission: "value:delete",
  input: coreValueIdSchema,
  audit: {
    action: "core_value.delete",
    entityType: "core_value",
    entityId: (resultat) => resultat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const deps = await coreValueDeps();

    const existante = await deps.read.findById(input.id);
    const title = existante?.title ?? "";

    const resultat = await deleteCoreValue(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, title } }
      : resultat;
  },
});
