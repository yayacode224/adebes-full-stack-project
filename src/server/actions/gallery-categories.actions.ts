"use server";

import type { GalleryCategory } from "@/core/cms/entities/gallery";
import {
  createGalleryCategorySchema,
  galleryCategoryIdSchema,
  reorderGalleryCategoriesSchema,
  updateGalleryCategorySchema,
} from "@/core/cms/schemas/gallery.schema";
import {
  createGalleryCategory,
  deleteGalleryCategory,
  reorderGalleryCategories,
  updateGalleryCategory,
} from "@/core/use-cases/gallery/manage-gallery-categories";

import { createAction } from "../action-kit/create-action";
import { galleryCategoryDeps } from "../deps/gallery.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES CATÉGORIES DE GALERIE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8H : « la catégorie devient une colonne ». Quatre actions, toutes dans
 * `createAction`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA PERMISSION DE CRÉATION EST `gallery:publish` — écart nº 70 qui se
 *     rejoue, à l'identique
 * ---------------------------------------------------------------------------
 * Le Lot 8B avait rencontré exactement la même contrainte sur
 * `article_categories`. La migration 0009 déclare ici :
 *
 *     gallery_categories_staff_update  → app_is_staff()      (éditeur compris)
 *     gallery_categories_admin_insert  → app_can_publish()   (admin et au-delà)
 *     gallery_categories_admin_delete  → app_can_publish()   (admin et au-delà)
 *
 * La création d'une catégorie est donc réservée aux administrateurs. Or la
 * matrice du §9 ne contient AUCUNE permission `gallery:*` de création réservée
 * aux administrateurs : `gallery:create` est ouverte à l'éditeur, puisqu'un
 * éditeur alimente la galerie.
 *
 * Les deux permissions dont les titulaires coïncident exactement avec
 * `app_can_publish()` sont `gallery:publish` et `gallery:delete`.
 * `gallery:delete` couvre naturellement la suppression ; il ne reste que
 * `gallery:publish` pour l'ajout.
 *
 * Le choix est donc CONTRAINT, exactement comme au Lot 8B, et l'alternative —
 * inventer une ressource `gallery_category` dans `RESOURCES` — aurait ajouté
 * six permissions au document d'audit qu'est le §9 pour une liste de quatre
 * libellés. **Ce qui est recetté : l'interface n'affiche jamais un bouton que
 * la base refusera.**
 *
 * ---------------------------------------------------------------------------
 * ÉTIQUETTES DE CACHE
 * ---------------------------------------------------------------------------
 * Renommer une catégorie change le libellé de son bouton de filtre sur
 * `/galerie` ; changer sa teinte change la couleur du repli d'une photo qui ne
 * charge pas ; la réordonner change l'ordre des boutons. Les trois touchent la
 * même page, et les deux étiquettes de la collection sont donc invalidées.
 */

/*
  ⚠️  NON EXPORTÉ, ET CE N'EST PAS UN OUBLI.

  Dans un fichier `"use server"`, TOUT export doit être une fonction
  asynchrone : Next.js transforme le module en table d'actions, et un export
  qui n'en est pas une fait échouer la compilation avec « The module has no
  exports at all » — un message qui ne nomme pas le coupable (découverte nº 24,
  écart nº 80).

  Les étiquettes sont publiées par `server/queries/gallery.query.ts`, du côté
  qui les lit.
*/
const ETIQUETTES = ["cms:galerie", "cms:page:galerie"];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création — administrateurs uniquement (voir l'en-tête)
 * ═══════════════════════════════════════════════════════════════════════════ */

export const creerCategorieGalerieAction = createAction<
  typeof createGalleryCategorySchema,
  GalleryCategory
>({
  permission: "gallery:publish",
  input: createGalleryCategorySchema,
  audit: {
    action: "gallery_category.create",
    entityType: "gallery_category",
    entityId: (categorie) => categorie.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    createGalleryCategory(await galleryCategoryDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Renommage et teinte — ouverts à l'éditeur, comme la RLS
 * ═══════════════════════════════════════════════════════════════════════════ */

export const renommerCategorieGalerieAction = createAction<
  typeof updateGalleryCategorySchema,
  GalleryCategory
>({
  permission: "gallery:update",
  input: updateGalleryCategorySchema,
  audit: {
    action: "gallery_category.update",
    entityType: "gallery_category",
    entityId: (categorie) => categorie.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    updateGalleryCategory(await galleryCategoryDeps(), input.id, {
      label: input.label,
      tone: input.tone,
    }),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Suppression — administrateurs, et refusée si la catégorie classe encore
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * ⚠️  `gallery_items.category_id` est en `on delete restrict` : la base refuse
 * déjà. Le cas d'usage compte les photos concernées AVANT, pour pouvoir dire
 * combien il y en a et quoi faire — un « Cet élément est utilisé ailleurs »
 * laisse l'utilisateur sans piste.
 */
export const supprimerCategorieGalerieAction = createAction<
  typeof galleryCategoryIdSchema,
  { id: string; label: string }
>({
  permission: "gallery:delete",
  input: galleryCategoryIdSchema,
  audit: {
    action: "gallery_category.delete",
    entityType: "gallery_category",
    entityId: (resultat) => resultat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    deleteGalleryCategory(await galleryCategoryDeps(), input.id),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement — l'ordre des filtres de /galerie
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * `gallery:reorder` — ouvert à l'éditeur : réordonner n'est pas publier. La
 * base dit la même chose (`reorder_rows` exige `app_is_staff()`).
 */
export const reordonnerCategoriesGalerieAction = createAction<
  typeof reorderGalleryCategoriesSchema,
  { count: number }
>({
  permission: "gallery:reorder",
  input: reorderGalleryCategoriesSchema,
  audit: {
    action: "gallery_category.reorder",
    entityType: "gallery_category",
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const resultat = await reorderGalleryCategories(
      await galleryCategoryDeps(),
      input.orderedIds,
    );
    return resultat.ok
      ? { ok: true as const, value: { count: input.orderedIds.length } }
      : resultat;
  },
});
