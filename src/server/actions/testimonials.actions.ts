"use server";

import type { Testimonial } from "@/core/cms/entities/testimonial";
import {
  createTestimonialSchema,
  reorderTestimonialsSchema,
  setTestimonialStatusSchema,
  testimonialIdSchema,
  updateTestimonialSchema,
} from "@/core/cms/schemas/testimonial.schema";
import { createTestimonial } from "@/core/use-cases/testimonials/create-testimonial";
import { deleteTestimonial } from "@/core/use-cases/testimonials/delete-testimonial";
import { reorderTestimonials } from "@/core/use-cases/testimonials/reorder-testimonials";
import { setTestimonialStatus } from "@/core/use-cases/testimonials/set-testimonial-status";
import { updateTestimonial } from "@/core/use-cases/testimonials/update-testimonial";

import { createAction } from "../action-kit/create-action";
import { testimonialDeps } from "../deps/testimonial.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES TÉMOIGNAGES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8C du Rapport 2. Les cinq passent par `createAction` — aucune exception
 * (décision D3). Une Server Action est une frontière publique : sans le
 * décorateur, `supprimerTemoignageAction` serait une API de suppression
 * ouverte, joignable par un POST direct sans jamais passer par le dashboard.
 *
 * ---------------------------------------------------------------------------
 * ÉTIQUETTES DE CACHE
 * ---------------------------------------------------------------------------
 * Plus simples qu'aux Lots 8A et 8B, et pour une raison de fond : **un
 * témoignage n'a pas de page à lui**. Il n'existe donc aucune étiquette
 * `cms:temoignage:<slug>` à invalider — seulement la collection et la page
 * composée où les témoignages apparaissent, l'accueil.
 *
 * `cms:page:accueil` est nommée en toutes lettres plutôt que déduite : le jour
 * où un bloc « témoignages » est ajouté à une deuxième page (Lot 9), l'oubli
 * doit se voir ici, à la relecture, et non se produire silencieusement.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE ACTION DE LECTURE ICI
 * ---------------------------------------------------------------------------
 * Comme au Lot 8A : l'écran reçoit ses lignes du rendu serveur et les filtre en
 * mémoire (`<DataTable>`, §6.1). Ajouter une action de lecture serait une
 * frontière publique de plus sans usage.
 */

const ETIQUETTES = ["cms:temoignages", "cms:page:accueil"];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Créer un témoignage.
 *
 * Le témoignage naît en brouillon, sans exception : `createTestimonialSchema`
 * ne transporte pas `status`, et le cas d'usage écrit `'draft'` en dur. C'est
 * ce qui garantit que toute mise en ligne passe par
 * `changerStatutTemoignageAction`, où l'accord de la personne est exigé.
 */
export const creerTemoignageAction = createAction<
  typeof createTestimonialSchema,
  Testimonial
>({
  permission: "testimonial:create",
  input: createTestimonialSchema,
  audit: {
    action: "testimonial.create",
    entityType: "testimonial",
    entityId: (temoignage) => temoignage.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => createTestimonial(await testimonialDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifier un témoignage.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage
 * (écart nº 20) : il désigne la cible, il n'en fait pas partie.
 *
 * Le statut n'est pas modifiable ici — le cas d'usage le neutralise. Et le
 * retrait de l'accord sur un témoignage EN LIGNE est refusé, avec le message
 * qui dit quoi faire : dépublier d'abord.
 */
export const mettreAJourTemoignageAction = createAction<
  typeof updateTestimonialSchema,
  Testimonial
>({
  permission: "testimonial:update",
  input: updateTestimonialSchema,
  audit: {
    action: "testimonial.update",
    entityType: "testimonial",
    entityId: (temoignage) => temoignage.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateTestimonial(await testimonialDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Publication
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Changer l'état éditorial.
 *
 * `testimonial:publish` — absent de la liste `editor` (§9 du Rapport 1). La
 * base dit la même chose avec le trigger `guard_publish` (ADB01) : un éditeur
 * qui appellerait cette action par un POST direct serait refusé deux fois.
 *
 * ⚠️  Et une TROISIÈME barrière, propre à ce lot : le cas d'usage refuse la
 * mise en ligne d'un témoignage dont l'accord n'est pas enregistré. Celle-là
 * ne dépend d'aucun rôle — un super administrateur y est soumis comme les
 * autres, parce qu'elle ne protège pas le site mais la personne citée.
 */
export const changerStatutTemoignageAction = createAction<
  typeof setTestimonialStatusSchema,
  Testimonial
>({
  permission: "testimonial:publish",
  input: setTestimonialStatusSchema,
  audit: {
    action: "testimonial.publish",
    entityType: "testimonial",
    entityId: (temoignage) => temoignage.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => setTestimonialStatus(await testimonialDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Réordonner la collection.
 *
 * `testimonial:reorder` — ouvert à l'éditeur : réordonner n'est pas publier.
 * La base dit la même chose (`reorder_rows` exige `app_is_staff()`).
 *
 * ⚠️  L'accueil n'affiche que les TROIS PREMIERS témoignages publiés :
 * réordonner change donc ce qui est visible, pas seulement dans quel ordre.
 * L'écran le dit.
 */
export const reordonnerTemoignagesAction = createAction<
  typeof reorderTestimonialsSchema,
  { count: number }
>({
  permission: "testimonial:reorder",
  input: reorderTestimonialsSchema,
  audit: { action: "testimonial.reorder", entityType: "testimonial" },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const resultat = await reorderTestimonials(
      await testimonialDeps(),
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
 * Supprimer un témoignage.
 *
 * `testimonial:delete` — administrateurs seulement, doublé par la RLS
 * (`testimonials_admin_delete`).
 *
 * Rien ne référence un témoignage : la suppression n'a aucun `on delete
 * restrict` à redouter. C'est l'inverse du Lot 8A, où c'est le témoignage qui
 * retient le programme.
 *
 * Le prénom est lu AVANT la suppression : après, il n'existe plus, et le
 * message de confirmation ne pourrait plus nommer ce qui a disparu.
 */
export const supprimerTemoignageAction = createAction<
  typeof testimonialIdSchema,
  { id: string; authorName: string }
>({
  permission: "testimonial:delete",
  input: testimonialIdSchema,
  audit: {
    action: "testimonial.delete",
    entityType: "testimonial",
    entityId: (resultat) => resultat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const deps = await testimonialDeps();

    const existant = await deps.read.findById(input.id);
    const authorName = existant?.authorName ?? "";

    const resultat = await deleteTestimonial(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, authorName } }
      : resultat;
  },
});
