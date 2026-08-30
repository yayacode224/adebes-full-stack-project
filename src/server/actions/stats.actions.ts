"use server";

import type { Stat } from "@/core/cms/entities/stat";
import {
  createStatSchema,
  reorderStatsSchema,
  setStatVisibilitySchema,
  statIdSchema,
  updateStatSchema,
} from "@/core/cms/schemas/stat.schema";
import { createStat } from "@/core/use-cases/stats/create-stat";
import { deleteStat } from "@/core/use-cases/stats/delete-stat";
import { reorderStats } from "@/core/use-cases/stats/reorder-stats";
import { setStatVisibility } from "@/core/use-cases/stats/set-stat-visibility";
import { updateStat } from "@/core/use-cases/stats/update-stat";

import { createAction } from "../action-kit/create-action";
import { statDeps } from "../deps/stat.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES CHIFFRES CLÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8G du Rapport 2. Les cinq passent par `createAction` — aucune exception
 * (décision D3). Une Server Action est une frontière publique : sans le
 * décorateur, `supprimerChiffreAction` serait une API de suppression ouverte,
 * joignable par un POST direct sans jamais passer par le dashboard.
 *
 * ---------------------------------------------------------------------------
 * TROIS ÉTIQUETTES DE CACHE, DONT UNE NOUVELLE
 * ---------------------------------------------------------------------------
 * `cms:chiffres`, `cms:page:accueil`, et **`cms:page:impact`** — celle-ci
 * n'existait pas : `/impact` était une page entièrement statique avant ce lot,
 * elle n'avait aucune raison d'être invalidée.
 *
 * Les trois sont nommées en toutes lettres plutôt que déduites, comme partout
 * ailleurs : le jour où un bloc `stats-grid` est ajouté à une troisième page
 * (Lot 9 — le seed en pose déjà un sur `accueil` ET sur `impact`), l'oubli doit
 * se voir ICI, à la relecture.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUNE ACTION N'EXIGE `stat:publish` — CETTE PERMISSION N'EXISTE PAS
 * ---------------------------------------------------------------------------
 * `stats` n'a pas de cycle éditorial. Afficher ou retirer un chiffre du site
 * relève de `stat:update`, que l'ÉDITEUR possède. C'est la configuration
 * `value:*` du Lot 8E, à l'identique — voir le raisonnement complet, et l'écart
 * de pouvoir qu'il crée, dans `set-stat-visibility.ts`.
 *
 * À l'inverse, `stat:create` et `stat:delete` sont RÉSERVÉS aux
 * administrateurs. La RLS dit exactement la même chose (`stats_admin_insert`,
 * `stats_admin_delete` : `app_can_publish()`).
 *
 * ---------------------------------------------------------------------------
 * AUCUNE ACTION DE LECTURE ICI
 * ---------------------------------------------------------------------------
 * Comme aux cinq lots précédents : l'écran reçoit ses lignes du rendu serveur
 * et les filtre en mémoire (`<DataTable>`, §6.1).
 */

const ETIQUETTES = ["cms:chiffres", "cms:page:accueil", "cms:page:impact"];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Créer un chiffre clé.
 *
 * `stat:create` — **absent de la liste `editor`**. Le §9 du Rapport 1 range
 * `stat` avec `value` pour la même raison : ces cartes sont la vitrine chiffrée
 * de l'association, pas un flux de contenu.
 *
 * Le chiffre naît VISIBLE — voir `create-stat.ts`. Sa clé technique est dérivée
 * du libellé et n'est pas saisie (écart nº 124).
 */
export const creerChiffreAction = createAction<typeof createStatSchema, Stat>({
  permission: "stat:create",
  input: createStatSchema,
  audit: {
    action: "stat.create",
    entityType: "stat",
    entityId: (stat) => stat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => createStat(await statDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifier un chiffre clé.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage
 * (écart nº 20) : il désigne la cible, il n'en fait pas partie.
 *
 * Ni la visibilité ni la clé technique ne sont modifiables ici — le cas d'usage
 * les neutralise toutes les deux.
 *
 * ⚠️  **C'est l'action qui porte l'invariant nº 1 de bout en bout.** C'est par
 * elle que `value: null` est écrit — « ce chiffre n'est pas encore
 * disponible » — et c'est la seule action du projet dont la charge utile doit
 * distinguer trois états sur un même champ : absent, `null`, et un nombre. Voir
 * `toStatUpdate`.
 */
export const mettreAJourChiffreAction = createAction<
  typeof updateStatSchema,
  Stat
>({
  permission: "stat:update",
  input: updateStatSchema,
  audit: {
    action: "stat.update",
    entityType: "stat",
    entityId: (stat) => stat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateStat(await statDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Affichage sur le site
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Afficher ou retirer un chiffre du site.
 *
 * ⚠️  `stat:update`, et non `stat:publish` : cette permission n'existe pas dans
 * la matrice. Un éditeur peut donc retirer un chiffre des deux pages publiques,
 * alors qu'il ne peut dépublier aucun programme. C'est ce que disent la matrice
 * et la RLS, indépendamment l'une de l'autre ; l'écart est consigné (jumeau de
 * l'écart nº 104), pas corrigé au détour d'un lot de collection.
 *
 * L'entrée d'audit reste distincte de `stat.update` — c'est une décision
 * différente, et le journal doit pouvoir répondre à « qui a retiré ce chiffre
 * du site » sans qu'on la cherche parmi les corrections de libellé.
 */
export const changerVisibiliteChiffreAction = createAction<
  typeof setStatVisibilitySchema,
  Stat
>({
  permission: "stat:update",
  input: setStatVisibilitySchema,
  audit: {
    action: "stat.visibility",
    entityType: "stat",
    entityId: (stat) => stat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => setStatVisibility(await statDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Réordonner la collection.
 *
 * `stat:reorder` — ouvert à l'éditeur : réordonner n'est ni créer ni supprimer.
 * La base dit la même chose (`reorder_rows` exige `app_is_staff()`).
 *
 * L'ordre se voit sur les deux pages en même temps, et il décide de ce qu'un
 * visiteur au téléphone lit en premier : la grille est en deux colonnes sous
 * 1024 px.
 */
export const reordonnerChiffresAction = createAction<
  typeof reorderStatsSchema,
  { count: number }
>({
  permission: "stat:reorder",
  input: reorderStatsSchema,
  audit: { action: "stat.reorder", entityType: "stat" },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const resultat = await reorderStats(await statDeps(), input.orderedIds);
    return resultat.ok
      ? { ok: true as const, value: { count: input.orderedIds.length } }
      : resultat;
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Suppression
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Supprimer un chiffre clé.
 *
 * `stat:delete` — administrateurs seulement, doublé par la RLS.
 *
 * Rien ne référence un chiffre : la suppression n'a aucun `on delete restrict`
 * à redouter. Mais elle est DÉFINITIVE au sens plein — il n'existe pas
 * d'archive où le ranger — et elle emporte la PRÉCISION qui rendait le chiffre
 * vérifiable. Masquer se défait ; supprimer ne se défait pas.
 *
 * Le libellé est lu AVANT la suppression : après, il n'existe plus, et le
 * message de confirmation ne pourrait plus nommer ce qui a disparu.
 */
export const supprimerChiffreAction = createAction<
  typeof statIdSchema,
  { id: string; label: string }
>({
  permission: "stat:delete",
  input: statIdSchema,
  audit: {
    action: "stat.delete",
    entityType: "stat",
    entityId: (resultat) => resultat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const deps = await statDeps();

    const existant = await deps.read.findById(input.id);
    const label = existant?.label ?? "";

    const resultat = await deleteStat(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, label } }
      : resultat;
  },
});
