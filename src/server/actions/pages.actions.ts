"use server";

import type { Page, PageSection } from "@/core/cms/entities/page";
import {
  addSectionSchema,
  createPageSchema,
  pageIdSchema,
  reorderSectionsSchema,
  sectionIdSchema,
  setPageStatusSchema,
  setSectionVisibilitySchema,
  updatePageSchema,
  updateSectionSchema,
} from "@/core/cms/schemas/page.schema";
import { createPage } from "@/core/use-cases/pages/create-page";
import { deletePage } from "@/core/use-cases/pages/delete-page";
import { setPageStatus } from "@/core/use-cases/pages/set-page-status";
import { updatePage } from "@/core/use-cases/pages/update-page";
import { addSection } from "@/core/use-cases/sections/add-section";
import { deleteSection } from "@/core/use-cases/sections/delete-section";
import { duplicateSection } from "@/core/use-cases/sections/duplicate-section";
import { reorderSections } from "@/core/use-cases/sections/reorder-sections";
import { setSectionVisibility } from "@/core/use-cases/sections/set-section-visibility";
import { updateSection } from "@/core/use-cases/sections/update-section";

import { createAction } from "../action-kit/create-action";
import { pageDeps } from "../deps/page.deps";
import { etiquettesDePage } from "../queries/pages.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES PAGES ET DES SECTIONS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §9 du Rapport 2. Les dix passent par `createAction` — aucune exception
 * (décision D3). Une Server Action est une frontière publique : sans le
 * décorateur, `supprimerSectionAction` serait une API de suppression ouverte,
 * joignable par un POST direct sans jamais passer par le dashboard.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'INVALIDATION DE CACHE EST DYNAMIQUE ICI — UNE PREMIÈRE
 * ---------------------------------------------------------------------------
 * Les neuf collections de la série 8 nomment leurs étiquettes en dur, parce
 * qu'elles savent quelles pages les lisent. Une page, elle, ne sait pas
 * d'avance QUELLE page elle est : l'étiquette dépend de son `slug`.
 *
 * `etiquettesDePage(slug)` compose donc la liste — et il faut le `slug`, pas
 * l'`id`. Deux conséquences que la relecture doit garder en tête :
 *
 *   * une action de SECTION doit remonter à sa page pour connaître le slug.
 *     C'est ce que fait chaque `invalidates` ci-dessous, à partir du RÉSULTAT
 *     de l'action et non de son entrée ;
 *   * **la suppression est le cas limite** : après coup, la page n'existe plus
 *     et son slug non plus. Il est donc lu AVANT, et renvoyé par le handler.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UN ÉDITEUR REMPLIT UNE SECTION, IL NE COMPOSE PAS LA PAGE
 * ---------------------------------------------------------------------------
 * C'est la matrice du §9, et la RLS dit exactement la même chose de son côté
 * (`page_sections_staff_update` accepte le personnel, `page_sections_admin_*`
 * exige `app_can_publish()`) :
 *
 *   * `section:update` et `section:reorder` — ouverts à l'éditeur ;
 *   * `section:create` et `section:delete` — administrateurs seulement ;
 *   * `page:update` — ouvert à l'éditeur ; `page:create`, `page:delete` et
 *     `page:publish` — administrateurs seulement.
 *
 * Un éditeur peut donc masquer une section (c'est `section:update`) mais pas la
 * supprimer, et corriger le titre d'une page mais pas la publier.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE ACTION DE LECTURE ICI
 * ---------------------------------------------------------------------------
 * Comme aux neuf lots précédents : l'écran reçoit ses lignes du rendu serveur.
 */

/* ═══════════════════════════════════════════════════════════════════════════
 * Pages
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Créer une page.
 *
 * `page:create` — administrateurs seulement, doublé par la RLS
 * (`pages_admin_insert`).
 *
 * ⚠️  La page naît en BROUILLON et n'est jamais système : ni `status` ni
 * `isSystem` ne font partie du contrat d'entrée. Voir `CreatePage`.
 */
export const creerPageAction = createAction<typeof createPageSchema, Page>({
  permission: "page:create",
  input: createPageSchema,
  audit: {
    action: "page.create",
    entityType: "page",
    entityId: (page) => page.id,
  },
  invalidates: (page) => etiquettesDePage(page.slug),
  handler: async ({ input }) => createPage(await pageDeps(), input),
});

/**
 * Modifier les réglages d'une page.
 *
 * `page:update` — ouvert à l'éditeur : corriger un titre ou une description de
 * référencement est un geste de rédaction.
 *
 * ⚠️  L'adresse et l'identifiant d'une page SYSTÈME restent verrouillés, quel
 * que soit le rôle. Le refus vient du cas d'usage, pas de la permission : c'est
 * une règle de cohérence du site, pas une question de droits.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage
 * (écart nº 20) : il désigne la cible, il n'en fait pas partie.
 */
export const mettreAJourPageAction = createAction<typeof updatePageSchema, Page>({
  permission: "page:update",
  input: updatePageSchema,
  audit: {
    action: "page.update",
    entityType: "page",
    entityId: (page) => page.id,
  },
  invalidates: (page) => etiquettesDePage(page.slug),
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updatePage(await pageDeps(), id, champs);
  },
});

/**
 * Publier, dépublier, archiver une page.
 *
 * `page:publish` — administrateurs seulement, doublé par le trigger
 * `guard_publish` (ADB01).
 *
 * ⚠️  Les deux gardes de contenu — aucune section visible invalide, aucun
 * « [À COMPLÉTER] » — vivent dans `setPageStatus()`. Ce ne sont pas des
 * questions de droits : un super administrateur ne peut pas davantage publier
 * une page dont une section visible est corrompue.
 *
 * L'entrée d'audit est DISTINCTE de `page.update` : le journal doit pouvoir
 * répondre à « qui a mis cette page en ligne » sans qu'on la cherche parmi les
 * corrections de texte.
 */
export const changerStatutPageAction = createAction<
  typeof setPageStatusSchema,
  Page
>({
  permission: "page:publish",
  input: setPageStatusSchema,
  audit: {
    action: "page.status",
    entityType: "page",
    entityId: (page) => page.id,
  },
  invalidates: (page) => etiquettesDePage(page.slug),
  handler: async ({ input }) => setPageStatus(await pageDeps(), input),
});

/**
 * Supprimer une page et ses sections.
 *
 * `page:delete` — administrateurs seulement, doublé par la RLS
 * (`pages_admin_delete`) ET par le trigger `guard_system_page` (ADB03) pour les
 * douze pages de la structure du site.
 *
 * ⚠️  Le SLUG est lu AVANT la suppression, et renvoyé. Après, la page n'existe
 * plus : `invalidates` ne saurait plus quelles étiquettes purger, et les pages
 * publiques garderaient l'ancienne version en cache jusqu'à expiration. Même
 * raison pour le titre, que le message de confirmation doit pouvoir nommer.
 */
export const supprimerPageAction = createAction<
  typeof pageIdSchema,
  { id: string; slug: string; title: string }
>({
  permission: "page:delete",
  input: pageIdSchema,
  audit: {
    action: "page.delete",
    entityType: "page",
    entityId: (resultat) => resultat.id,
  },
  invalidates: (resultat) => etiquettesDePage(resultat.slug),
  handler: async ({ input }) => {
    const deps = await pageDeps();

    const page = await deps.read.findById(input.id);
    const resultat = await deletePage(deps, input.id);
    if (!resultat.ok) return resultat;

    return {
      ok: true as const,
      value: {
        id: input.id,
        slug: page?.slug ?? "",
        title: page?.title ?? "cette page",
      },
    };
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Sections
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Ce que toutes les actions de section rendent.
 *
 * ⚠️  `pageSlug` est PORTÉ PAR LE RÉSULTAT, et ce n'est pas du confort : sans
 * lui, `invalidates` ne saurait pas quelle page purger. Une section ne connaît
 * que l'`id` de sa page ; l'étiquette de cache, elle, se compose sur le slug.
 */
type ResultatDeSection = {
  section: PageSection | null;
  pageId: string;
  pageSlug: string;
};

/** Retrouve le slug d'une page à partir de son identifiant. */
async function slugDeLaPage(
  deps: Awaited<ReturnType<typeof pageDeps>>,
  pageId: string,
): Promise<string> {
  if (!pageId) return "";
  const page = await deps.read.findById(pageId);
  return page?.slug ?? "";
}

/**
 * Ajouter une section.
 *
 * `section:create` — administrateurs seulement (`page_sections_admin_insert`).
 * « L'éditeur remplit une section existante mais ne compose pas la page »,
 * §9 du Rapport 1.
 *
 * La section naît avec les VALEURS PAR DÉFAUT de son bloc — jamais `{}` — donc
 * immédiatement valide et immédiatement rendue. Voir `add-section.ts`.
 */
export const ajouterSectionAction = createAction<
  typeof addSectionSchema,
  ResultatDeSection
>({
  permission: "section:create",
  input: addSectionSchema,
  audit: {
    action: "section.create",
    entityType: "page_section",
    entityId: (resultat) => resultat.section?.id,
  },
  invalidates: (resultat) => etiquettesDePage(resultat.pageSlug),
  handler: async ({ input }) => {
    const deps = await pageDeps();
    const resultat = await addSection(deps, input);
    if (!resultat.ok) return resultat;

    return {
      ok: true as const,
      value: {
        section: resultat.value,
        pageId: input.pageId,
        pageSlug: await slugDeLaPage(deps, input.pageId),
      },
    };
  },
});

/**
 * Enregistrer le contenu d'une section.
 *
 * `section:update` — ouvert à l'éditeur : c'est le geste de rédaction du CMS,
 * celui que cet écran existe pour permettre.
 *
 * ⚠️  Le contenu est validé contre le schéma du BLOC, dans le cas d'usage. Ce
 * fichier ne peut pas le faire : `updateSectionSchema` ne connaît pas le type
 * de bloc de la section visée, qui n'est lu qu'en base.
 */
export const mettreAJourSectionAction = createAction<
  typeof updateSectionSchema,
  ResultatDeSection
>({
  permission: "section:update",
  input: updateSectionSchema,
  audit: {
    action: "section.update",
    entityType: "page_section",
    entityId: (resultat) => resultat.section?.id,
  },
  invalidates: (resultat) => etiquettesDePage(resultat.pageSlug),
  handler: async ({ input }) => {
    const deps = await pageDeps();
    const resultat = await updateSection(deps, input);
    if (!resultat.ok) return resultat;

    return {
      ok: true as const,
      value: {
        section: resultat.value,
        pageId: resultat.value.pageId,
        pageSlug: await slugDeLaPage(deps, resultat.value.pageId),
      },
    };
  },
});

/**
 * Afficher ou masquer une section sur le site.
 *
 * `section:update`, et non `section:publish` : cette permission n'existe pas
 * dans la matrice. Un éditeur peut donc retirer une section du site public,
 * alors qu'il ne peut dépublier aucune page.
 *
 * La nuance est volontaire : masquer une section est un geste de rédaction
 * réversible qui ne touche qu'un morceau de page ; dépublier une page est une
 * décision éditoriale qui retire une URL entière du site.
 *
 * L'entrée d'audit reste distincte de `section.update`.
 */
export const changerVisibiliteSectionAction = createAction<
  typeof setSectionVisibilitySchema,
  ResultatDeSection
>({
  permission: "section:update",
  input: setSectionVisibilitySchema,
  audit: {
    action: "section.visibility",
    entityType: "page_section",
    entityId: (resultat) => resultat.section?.id,
  },
  invalidates: (resultat) => etiquettesDePage(resultat.pageSlug),
  handler: async ({ input }) => {
    const deps = await pageDeps();
    const resultat = await setSectionVisibility(deps, input);
    if (!resultat.ok) return resultat;

    return {
      ok: true as const,
      value: {
        section: resultat.value,
        pageId: resultat.value.pageId,
        pageSlug: await slugDeLaPage(deps, resultat.value.pageId),
      },
    };
  },
});

/**
 * Dupliquer une section.
 *
 * `section:create` — c'est une création, quelle que soit la porte employée.
 * Lui donner `section:update` aurait ouvert à l'éditeur un chemin de création
 * que la RLS refuse de toute façon, produisant un échec incompréhensible.
 *
 * ⚠️  La copie naît MASQUÉE, même si l'originale est visible : dupliquer une
 * section publiée ne doit jamais mettre en ligne un doublon exact.
 */
export const dupliquerSectionAction = createAction<
  typeof sectionIdSchema,
  ResultatDeSection
>({
  permission: "section:create",
  input: sectionIdSchema,
  audit: {
    action: "section.duplicate",
    entityType: "page_section",
    entityId: (resultat) => resultat.section?.id,
  },
  invalidates: (resultat) => etiquettesDePage(resultat.pageSlug),
  handler: async ({ input }) => {
    const deps = await pageDeps();
    const resultat = await duplicateSection(deps, input.id);
    if (!resultat.ok) return resultat;

    return {
      ok: true as const,
      value: {
        section: resultat.value,
        pageId: resultat.value.pageId,
        pageSlug: await slugDeLaPage(deps, resultat.value.pageId),
      },
    };
  },
});

/**
 * Réordonner les sections d'une page.
 *
 * `section:reorder` — ouvert à l'éditeur : réordonner n'est ni créer ni
 * supprimer. La base dit la même chose (`reorder_rows` exige `app_is_staff()`).
 *
 * ⚠️  Le cas d'usage vérifie que TOUS les identifiants appartiennent à la page
 * annoncée. `reorder_rows()` renumérote par identifiants, sans notion de
 * parent : une liste mêlant deux pages réordonnerait les deux, en silence.
 */
export const reordonnerSectionsAction = createAction<
  typeof reorderSectionsSchema,
  ResultatDeSection & { count: number }
>({
  permission: "section:reorder",
  input: reorderSectionsSchema,
  audit: { action: "section.reorder", entityType: "page_section" },
  invalidates: (resultat) => etiquettesDePage(resultat.pageSlug),
  handler: async ({ input }) => {
    const deps = await pageDeps();
    const resultat = await reorderSections(deps, input);
    if (!resultat.ok) return resultat;

    return {
      ok: true as const,
      value: {
        section: null,
        pageId: input.pageId,
        pageSlug: await slugDeLaPage(deps, input.pageId),
        count: input.orderedIds.length,
      },
    };
  },
});

/**
 * Supprimer une section.
 *
 * `section:delete` — administrateurs seulement (`page_sections_admin_delete`).
 *
 * ⚠️  La section est lue AVANT la suppression, pour la même raison que sur
 * `supprimerPageAction` : après, elle n'existe plus et rien ne dirait à quelle
 * page elle appartenait — donc quelle étiquette de cache purger.
 *
 * Les positions restantes sont renumérotées de 1 à N par le cas d'usage, sans
 * quoi le prochain ajout viserait une position déjà prise.
 */
export const supprimerSectionAction = createAction<
  typeof sectionIdSchema,
  ResultatDeSection & { blockType: string }
>({
  permission: "section:delete",
  input: sectionIdSchema,
  audit: {
    action: "section.delete",
    entityType: "page_section",
    entityId: (resultat) => resultat.pageId,
  },
  invalidates: (resultat) => etiquettesDePage(resultat.pageSlug),
  handler: async ({ input }) => {
    const deps = await pageDeps();

    const section = await deps.sectionRead.findById(input.id);
    const resultat = await deleteSection(deps, input.id);
    if (!resultat.ok) return resultat;

    const pageId = section?.pageId ?? "";

    return {
      ok: true as const,
      value: {
        section: null,
        pageId,
        pageSlug: await slugDeLaPage(deps, pageId),
        blockType: section?.blockType ?? "",
      },
    };
  },
});
