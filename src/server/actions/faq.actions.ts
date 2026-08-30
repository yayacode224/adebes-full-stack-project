"use server";

import type { FaqItem } from "@/core/cms/entities/faq-item";
import {
  createFaqItemSchema,
  faqItemIdSchema,
  reorderFaqItemsSchema,
  setFaqItemStatusSchema,
  updateFaqItemSchema,
} from "@/core/cms/schemas/faq-item.schema";
import { createFaqItem } from "@/core/use-cases/faq-items/create-faq-item";
import { deleteFaqItem } from "@/core/use-cases/faq-items/delete-faq-item";
import { reorderFaqItems } from "@/core/use-cases/faq-items/reorder-faq-items";
import { setFaqItemStatus } from "@/core/use-cases/faq-items/set-faq-item-status";
import { updateFaqItem } from "@/core/use-cases/faq-items/update-faq-item";

import { createAction } from "../action-kit/create-action";
import { faqItemDeps } from "../deps/faq-item.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES QUESTIONS FRÉQUENTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8F du Rapport 2. Les cinq passent par `createAction` — aucune exception
 * (décision D3). Une Server Action est une frontière publique : sans le
 * décorateur, `supprimerQuestionAction` serait une API de suppression ouverte,
 * joignable par un POST direct sans jamais passer par le dashboard.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  QUATRE ÉTIQUETTES DE CACHE — LE PLUS GRAND NOMBRE DU PROJET
 * ---------------------------------------------------------------------------
 * La FAQ est lue par TROIS pages publiques : l'accueil, « Faire un don » et
 * « Devenir bénévole ». Le Lot 8E en alimentait deux, les quatre lots
 * précédents une seule chacun.
 *
 * Deux de ces étiquettes sont NOUVELLES — `cms:page:don` et
 * `cms:page:benevolat`. Les deux pages lisaient déjà la base (les programmes,
 * depuis le Lot 8A) mais n'avaient jamais eu de contenu à invalider qui leur
 * soit propre.
 *
 * ⚠️  Les quatre sont invalidées à CHAQUE mutation, y compris quand la question
 * touchée n'appartient qu'à un sujet. C'est délibéré, et ce n'est pas de la
 * paresse :
 *
 *   * `updateFaqItem` peut CHANGER le sujet. Il faudrait alors invalider la
 *     page de départ ET celle d'arrivée — donc lire l'ancienne valeur avant
 *     d'écrire, uniquement pour économiser une invalidation ;
 *   * une question de don peut figurer sur l'accueil, selon sa position ;
 *   * un simple réordonnancement change ce que l'accueil affiche (les quatre
 *     premières hors bénévolat), sans toucher au moindre sujet.
 *
 * Invalider large est ici la seule forme CORRECTE. Invalider fin aurait exigé
 * de raisonner juste à chaque appel, et l'erreur — une page qui garde une
 * réponse périmée — serait invisible depuis le dashboard.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE ACTION DE LECTURE ICI
 * ---------------------------------------------------------------------------
 * Comme aux cinq lots précédents : l'écran reçoit ses lignes du rendu serveur
 * et les filtre en mémoire (`<DataTable>`, §6.1).
 */

const ETIQUETTES = [
  "cms:faq",
  "cms:page:accueil",
  "cms:page:don",
  "cms:page:benevolat",
];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Créer une question.
 *
 * La question naît en brouillon, sans exception : `createFaqItemSchema` ne
 * transporte pas `status`, et le cas d'usage écrit `'draft'` en dur. C'est ce
 * qui garantit que toute mise en ligne passe par `changerStatutQuestionAction`,
 * où l'on vérifie qu'il y a bien une question ET une réponse avant de les
 * déclarer aux moteurs de recherche.
 */
export const creerQuestionAction = createAction<
  typeof createFaqItemSchema,
  FaqItem
>({
  permission: "faq:create",
  input: createFaqItemSchema,
  audit: {
    action: "faq_item.create",
    entityType: "faq_item",
    entityId: (question) => question.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => createFaqItem(await faqItemDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifier une question.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage
 * (écart nº 20) : il désigne la cible, il n'en fait pas partie.
 *
 * Le statut n'est pas modifiable ici — le cas d'usage le neutralise. Le SUJET,
 * lui, l'est : c'est la façon de corriger un classement, et cela déplace la
 * question d'une page publique à une autre. Le formulaire l'écrit sous le
 * champ.
 */
export const mettreAJourQuestionAction = createAction<
  typeof updateFaqItemSchema,
  FaqItem
>({
  permission: "faq:update",
  input: updateFaqItemSchema,
  audit: {
    action: "faq_item.update",
    entityType: "faq_item",
    entityId: (question) => question.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateFaqItem(await faqItemDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Publication
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Changer l'état éditorial.
 *
 * `faq:publish` — absent de la liste `editor` (§9 du Rapport 1). La base dit la
 * même chose avec le trigger `guard_publish` (ADB01) : un éditeur qui
 * appellerait cette action par un POST direct serait refusé deux fois.
 *
 * ⚠️  Publier une question ne l'affiche pas seulement : elle entre dans le
 * JSON-LD `FAQPage` de sa page, c'est-à-dire dans une déclaration destinée aux
 * moteurs de recherche. C'est ce qui justifie que la mise en ligne reste
 * réservée aux administrateurs sur cette collection comme sur les autres.
 */
export const changerStatutQuestionAction = createAction<
  typeof setFaqItemStatusSchema,
  FaqItem
>({
  permission: "faq:publish",
  input: setFaqItemStatusSchema,
  audit: {
    action: "faq_item.publish",
    entityType: "faq_item",
    entityId: (question) => question.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => setFaqItemStatus(await faqItemDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Réordonner la collection.
 *
 * `faq:reorder` — ouvert à l'éditeur : réordonner n'est pas publier. La base
 * dit la même chose (`reorder_rows` exige `app_is_staff()`).
 *
 * ⚠️  Contrairement à l'équipe, l'ordre DÉCIDE ici de ce qui est visible :
 * l'accueil n'affiche que les quatre premières questions hors bénévolat. Un
 * éditeur peut donc, sans avoir `faq:publish`, retirer une question de
 * l'accueil en en remontant une autre. Elle reste en ligne sur la page de son
 * sujet — ce n'est pas une dépublication déguisée — mais l'écart mérite d'être
 * écrit : c'est le même mécanisme qu'au Lot 8C pour les trois témoignages de
 * l'accueil, et l'écran de liste le signale.
 */
export const reordonnerQuestionsAction = createAction<
  typeof reorderFaqItemsSchema,
  { count: number }
>({
  permission: "faq:reorder",
  input: reorderFaqItemsSchema,
  audit: { action: "faq_item.reorder", entityType: "faq_item" },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const resultat = await reorderFaqItems(await faqItemDeps(), input.orderedIds);
    return resultat.ok
      ? { ok: true as const, value: { count: input.orderedIds.length } }
      : resultat;
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Suppression
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Supprimer une question.
 *
 * `faq:delete` — administrateurs seulement, doublé par la RLS.
 *
 * Rien ne référence une question et elle ne référence rien : la suppression n'a
 * aucun `on delete restrict` à redouter, ni aucun fichier à détacher.
 *
 * Le libellé est lu AVANT la suppression : après, il n'existe plus, et le
 * message de confirmation ne pourrait plus nommer ce qui a disparu.
 */
export const supprimerQuestionAction = createAction<
  typeof faqItemIdSchema,
  { id: string; question: string }
>({
  permission: "faq:delete",
  input: faqItemIdSchema,
  audit: {
    action: "faq_item.delete",
    entityType: "faq_item",
    entityId: (resultat) => resultat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const deps = await faqItemDeps();

    const existante = await deps.read.findById(input.id);
    const question = existante?.question ?? "";

    const resultat = await deleteFaqItem(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, question } }
      : resultat;
  },
});
