"use server";

import type { GalleryItem } from "@/core/cms/entities/gallery";
import {
  createGalleryItemSchema,
  galleryItemIdSchema,
  reorderGalleryItemsSchema,
  setGalleryItemStatusSchema,
  updateGalleryItemSchema,
} from "@/core/cms/schemas/gallery.schema";
import { createGalleryItem } from "@/core/use-cases/gallery/create-gallery-item";
import { deleteGalleryItem } from "@/core/use-cases/gallery/delete-gallery-item";
import { reorderGalleryItems } from "@/core/use-cases/gallery/reorder-gallery-items";
import { setGalleryItemStatus } from "@/core/use-cases/gallery/set-gallery-item-status";
import { updateGalleryItem } from "@/core/use-cases/gallery/update-gallery-item";

import { createAction } from "../action-kit/create-action";
import { galleryItemDeps } from "../deps/gallery.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DE LA GALERIE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8H du Rapport 2. Les cinq passent par `createAction` — aucune exception
 * (décision D3). Une Server Action est une frontière publique : sans le
 * décorateur, `supprimerElementGalerieAction` serait une API de suppression
 * ouverte, joignable par un POST direct sans jamais passer par le dashboard.
 *
 * ---------------------------------------------------------------------------
 * DEUX ÉTIQUETTES DE CACHE
 * ---------------------------------------------------------------------------
 * `cms:galerie` et `cms:page:galerie`. La seconde est NOUVELLE — `/galerie`
 * était jusqu'ici une page entièrement statique, alimentée par une lecture de
 * disque au moment du build. C'est la deuxième page du projet dans ce cas,
 * après `/impact` au Lot 8G (écart nº 131).
 *
 * ⚠️  Il n'y en a pas de troisième, et c'est une différence réelle avec les
 * lots précédents : **aucune autre page publique n'affiche la galerie**.
 * L'accueil ne montre pas de photos de galerie (vérifié : la section
 * `gallery-preview` de la page `galerie` est un squelette du seed, sans
 * contenu, et le Lot 9 s'en chargera), et il n'y a pas de page par photo. Les
 * étiquettes suivent donc l'usage réel plutôt qu'un gabarit recopié.
 *
 * `cms:media` n'est PAS invalidée : ces actions ne touchent jamais
 * `media_assets`. Un élément de galerie RÉFÉRENCE une photo, il ne la modifie
 * pas — c'est la médiathèque (Lot 7) qui en a la charge, et ses propres
 * actions invalident déjà cette étiquette-là.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE ACTION DE LECTURE ICI
 * ---------------------------------------------------------------------------
 * Comme aux sept lots précédents : l'écran reçoit ses lignes du rendu serveur
 * et les filtre en mémoire (`<DataTable>`, §6.1).
 */

const ETIQUETTES = ["cms:galerie", "cms:page:galerie"];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Ajouter une photo à la galerie.
 *
 * L'élément naît en brouillon, sans exception : `createGalleryItemSchema` ne
 * transporte pas `status`, et le cas d'usage écrit `'draft'` en dur. C'est ce
 * qui garantit que toute mise en ligne passe par
 * `changerStatutElementGalerieAction`.
 *
 * ⚠️  Cette action ne téléverse RIEN. Le fichier rejoint la médiathèque par
 * `media.actions.ts` (Lot 7) ; ici on ne fait que désigner un média déjà
 * catalogué. La séparation est celle du §7.3 : « renvoie un `mediaId`, jamais
 * une URL ».
 */
export const creerElementGalerieAction = createAction<
  typeof createGalleryItemSchema,
  GalleryItem
>({
  permission: "gallery:create",
  input: createGalleryItemSchema,
  audit: {
    action: "gallery_item.create",
    entityType: "gallery_item",
    entityId: (element) => element.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => createGalleryItem(await galleryItemDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifier un élément — sa photo, sa catégorie.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage
 * (écart nº 20) : il désigne la cible, il n'en fait pas partie.
 *
 * Le statut n'est pas modifiable ici — le cas d'usage le neutralise.
 */
export const mettreAJourElementGalerieAction = createAction<
  typeof updateGalleryItemSchema,
  GalleryItem
>({
  permission: "gallery:update",
  input: updateGalleryItemSchema,
  audit: {
    action: "gallery_item.update",
    entityType: "gallery_item",
    entityId: (element) => element.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateGalleryItem(await galleryItemDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Publication
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Changer l'état éditorial.
 *
 * `gallery:publish` — absent de la liste `editor` (§9 du Rapport 1). La base dit
 * la même chose avec le trigger `gallery_items_guard_publish` (ADB01,
 * migration 0010) : un éditeur qui appellerait cette action par un POST direct
 * serait refusé deux fois.
 */
export const changerStatutElementGalerieAction = createAction<
  typeof setGalleryItemStatusSchema,
  GalleryItem
>({
  permission: "gallery:publish",
  input: setGalleryItemStatusSchema,
  audit: {
    action: "gallery_item.publish",
    entityType: "gallery_item",
    entityId: (element) => element.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    setGalleryItemStatus(await galleryItemDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Réordonner la grille.
 *
 * `gallery:reorder` — ouvert à l'éditeur : réordonner n'est pas publier. La base
 * dit la même chose (`reorder_rows` exige `app_is_staff()`).
 *
 * ⚠️  Contrairement au Lot 8F (écart nº 120), l'ordre ne décide de rien :
 * `/galerie` affiche TOUTES les photos publiées, sans coupe. Un éditeur ne peut
 * donc pas, en réordonnant, faire disparaître un contenu du site. C'est le seul
 * lot du Lot 8 à réordonnancement où cette question ne se pose pas — vérifié
 * dans la page publique, pas supposé.
 */
export const reordonnerElementsGalerieAction = createAction<
  typeof reorderGalleryItemsSchema,
  { count: number }
>({
  permission: "gallery:reorder",
  input: reorderGalleryItemsSchema,
  audit: { action: "gallery_item.reorder", entityType: "gallery_item" },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const resultat = await reorderGalleryItems(
      await galleryItemDeps(),
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
 * Retirer une photo de la galerie.
 *
 * `gallery:delete` — administrateurs seulement, doublé par la RLS
 * (`gallery_items_admin_delete`).
 *
 * ⚠️  Le FICHIER n'est pas supprimé : il reste dans la médiathèque. La
 * confirmation de l'écran l'écrit, et le cas d'usage l'explique.
 *
 * `mediaId` est lu AVANT la suppression : après, la ligne n'existe plus, et le
 * message de confirmation ne pourrait plus désigner la photo concernée.
 */
export const supprimerElementGalerieAction = createAction<
  typeof galleryItemIdSchema,
  { id: string; mediaId: string | null }
>({
  permission: "gallery:delete",
  input: galleryItemIdSchema,
  audit: {
    action: "gallery_item.delete",
    entityType: "gallery_item",
    entityId: (resultat) => resultat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const deps = await galleryItemDeps();

    const existant = await deps.read.findById(input.id);
    const mediaId = existant?.mediaId ?? null;

    const resultat = await deleteGalleryItem(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, mediaId } }
      : resultat;
  },
});
