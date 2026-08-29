"use server";

import type { Programme } from "@/core/cms/entities/programme";
import {
  createProgrammeSchema,
  programmeIdSchema,
  reorderProgrammesSchema,
  setProgrammeStatusSchema,
  updateProgrammeSchema,
} from "@/core/cms/schemas/programme.schema";
import { createProgramme } from "@/core/use-cases/programmes/create-programme";
import { deleteProgramme } from "@/core/use-cases/programmes/delete-programme";
import { reorderProgrammes } from "@/core/use-cases/programmes/reorder-programmes";
import { setProgrammeStatus } from "@/core/use-cases/programmes/set-programme-status";
import { updateProgramme } from "@/core/use-cases/programmes/update-programme";

import { createAction } from "../action-kit/create-action";
import { programmeDeps } from "../deps/programme.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES PROGRAMMES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8A.4 du Rapport 2. Les six passent par `createAction` — aucune exception
 * (décision D3). Une Server Action est une frontière publique : sans le
 * décorateur, `supprimerProgrammeAction` serait une API de suppression ouverte,
 * joignable par un POST direct sans jamais passer par le dashboard.
 *
 * ---------------------------------------------------------------------------
 * ÉTIQUETTES DE CACHE (§11 du Rapport 1, §8A.4 du Rapport 2)
 * ---------------------------------------------------------------------------
 * Trois familles, et la troisième est celle qu'on oublie :
 *
 *   * `cms:programmes` — la collection ;
 *   * `cms:programme:<slug>` — la fiche ;
 *   * `cms:page:accueil` et `cms:page:programmes` — les PAGES où un programme
 *     apparaît sans être le sujet principal. Un programme renommé change le
 *     bloc `programmes-grid` de l'accueil ; sans cette étiquette, la page
 *     d'accueil garderait l'ancien titre.
 *
 * Le renommage d'une adresse invalide DEUX fiches : l'ancienne (qui doit
 * cesser de répondre) et la nouvelle. `invalidates` reçoit le résultat ET
 * l'entrée, ce qui permet de nommer les deux.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE ACTION DE LECTURE ICI, CONTRAIREMENT À LA MÉDIATHÈQUE
 * ---------------------------------------------------------------------------
 * `media.actions.ts` expose `listerMediasAction` parce que sa grille se
 * recharge depuis le navigateur à chaque frappe. L'écran des programmes, lui,
 * reçoit ses huit lignes du rendu serveur et les filtre en mémoire
 * (`<DataTable>`, §6.1) : il n'a rien à redemander. Ajouter une action de
 * lecture serait une frontière publique de plus sans usage.
 */

const ETIQUETTE_COLLECTION = "cms:programmes";

/**
 * Les pages composées où un programme apparaît.
 *
 * Écrites en toutes lettres plutôt que déduites : le jour où un bloc
 * `programmes-grid` est ajouté à une troisième page (Lot 9), l'oubli doit se
 * voir ici, à la relecture, et non se produire silencieusement.
 */
const ETIQUETTES_PAGES = ["cms:page:accueil", "cms:page:programmes"] as const;

/** Toutes les étiquettes touchées par une mutation portant sur ces slugs. */
function etiquettes(...slugs: (string | undefined)[]): string[] {
  const uniques = [...new Set(slugs.filter((slug): slug is string => !!slug))];
  return [
    ETIQUETTE_COLLECTION,
    ...ETIQUETTES_PAGES,
    ...uniques.map((slug) => `cms:programme:${slug}`),
  ];
}

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

export const creerProgrammeAction = createAction<
  typeof createProgrammeSchema,
  Programme
>({
  permission: "programme:create",
  input: createProgrammeSchema,
  audit: {
    action: "programme.create",
    entityType: "programme",
    entityId: (programme) => programme.id,
  },
  invalidates: (programme) => etiquettes(programme.slug),
  handler: async ({ input }) => createProgramme(await programmeDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifier un programme.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage
 * (écart nº 20) : il désigne la cible, il n'en fait pas partie. Le laisser
 * dedans inviterait à l'écrire en base, où il est immuable.
 *
 * Le statut n'est pas modifiable ici — c'est `publierProgrammeAction` qui s'en
 * charge, et le cas d'usage le neutralise de toute façon. Un formulaire qui
 * renverrait l'entité complète ne doit pas publier par effet de bord.
 */
export const mettreAJourProgrammeAction = createAction<
  typeof updateProgrammeSchema,
  Programme
>({
  permission: "programme:update",
  input: updateProgrammeSchema,
  audit: {
    action: "programme.update",
    entityType: "programme",
    entityId: (programme) => programme.id,
  },
  /*
    L'ANCIENNE adresse est invalidée en plus de la nouvelle : après un
    renommage, `/programmes/ancien-slug` doit cesser de répondre depuis le
    cache, sans quoi deux adresses serviraient la même page.
  */
  invalidates: (programme, input) => etiquettes(programme.slug, input.slug),
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateProgramme(await programmeDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Publication
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Changer l'état éditorial.
 *
 * `programme:publish` — absent de la liste `editor` (§9 du Rapport 1). La base
 * dit la même chose avec le trigger `guard_publish` (ADB01) : un éditeur qui
 * appellerait cette action par un POST direct serait refusé deux fois.
 *
 * Une seule action pour les quatre transitions plutôt qu'une par état : le
 * §8A.4 en nomme deux (`publish`, `unpublish`), mais l'archivage et le retour
 * en brouillon suivent exactement la même règle. Trois actions identiques à un
 * littéral près auraient été trois occasions d'oublier une étiquette de cache.
 */
export const changerStatutProgrammeAction = createAction<
  typeof setProgrammeStatusSchema,
  Programme
>({
  permission: "programme:publish",
  input: setProgrammeStatusSchema,
  audit: {
    action: "programme.publish",
    entityType: "programme",
    entityId: (programme) => programme.id,
  },
  invalidates: (programme) => etiquettes(programme.slug),
  handler: async ({ input }) => setProgrammeStatus(await programmeDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Réordonner la collection.
 *
 * `programme:reorder` — ouvert à l'éditeur : réordonner n'est pas publier.
 * La liste reçue est ENTIÈRE ; le cas d'usage refuse une liste partielle, un
 * doublon ou un identifiant inconnu.
 *
 * Aucune fiche n'est invalidée individuellement : l'ordre ne change pas le
 * contenu d'un programme, seulement celui des listes qui les affichent.
 */
export const reordonnerProgrammesAction = createAction<
  typeof reorderProgrammesSchema,
  { count: number }
>({
  permission: "programme:reorder",
  input: reorderProgrammesSchema,
  audit: { action: "programme.reorder", entityType: "programme" },
  invalidates: () => etiquettes(),
  handler: async ({ input }) => {
    const resultat = await reorderProgrammes(
      await programmeDeps(),
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
 * Supprimer un programme.
 *
 * `programme:delete` — administrateurs seulement, doublé par la RLS.
 *
 * ⚠️  Un programme cité par un témoignage NE PEUT PAS être supprimé :
 * `testimonials.programme_id` est en `on delete restrict`. PostgreSQL lève
 * alors 23503, que le dépôt traduit en `CONFLICT` avec un message français —
 * « Cet élément est utilisé ailleurs » — et non en erreur SQL brute. C'est le
 * point de recette explicite du §8A.
 *
 * Le slug est lu AVANT la suppression : après, il n'existe plus, et
 * l'étiquette `cms:programme:<slug>` resterait dans le cache pour toujours.
 */
export const supprimerProgrammeAction = createAction<
  typeof programmeIdSchema,
  { id: string; slug: string }
>({
  permission: "programme:delete",
  input: programmeIdSchema,
  audit: {
    action: "programme.delete",
    entityType: "programme",
    entityId: (resultat) => resultat.id,
  },
  invalidates: (resultat) => etiquettes(resultat.slug),
  handler: async ({ input }) => {
    const deps = await programmeDeps();

    const existant = await deps.read.findById(input.id);
    const slug = existant?.slug ?? "";

    const resultat = await deleteProgramme(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, slug } }
      : resultat;
  },
});
