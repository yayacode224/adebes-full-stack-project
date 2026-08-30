import "server-only";

import { cache } from "react";

import type { GalleryCategory, GalleryItem } from "@/core/cms/entities/gallery";
import type {
  GalleryCategoryReadPort,
  GalleryItemReadPort,
} from "@/core/cms/ports/gallery.port";
import { listPublishedGalleryItems } from "@/core/use-cases/gallery/list-gallery-items";
import { listGalleryCategories } from "@/core/use-cases/gallery/manage-gallery-categories";
import { createPublicClient } from "@/infrastructure/supabase/clients/public";
import { SupabaseGalleryCategoryRepository } from "@/infrastructure/supabase/repositories/gallery-category.repository";
import { SupabaseGalleryItemRepository } from "@/infrastructure/supabase/repositories/gallery-item.repository";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LECTURES PUBLIQUES DE LA GALERIE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §11 du Rapport 1. C'est la seule porte par laquelle le site public lit la
 * galerie : aucune page de `src/app/(site)/` n'appelle un dépôt.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE QUE CE FICHIER REMPLACE : UNE LECTURE DE DISQUE
 * ---------------------------------------------------------------------------
 * `src/content/galerie.ts` faisait un `fs.readdirSync(public/images/galerie)`
 * au moment du build, décidait de la catégorie d'après le PRÉFIXE du nom de
 * fichier (`education-01.jpeg`), et lisait un `legendes.json` facultatif pour
 * les textes alternatifs.
 *
 * C'est la seule collection du Lot 8 dont la source de vérité était un DOSSIER
 * et non un tableau TypeScript, et cela change trois choses :
 *
 *   1. **La convention de nommage disparaît.** Une photo peut s'appeler comme
 *      elle veut ; c'est `gallery_items.category_id` qui la classe. Renommer un
 *      fichier ne déclasse plus une photo par accident.
 *   2. **Les légendes ne sont plus dans un fichier à part.** Elles vivent dans
 *      `media_assets.alt_text`, qui est `not null` : une photo NE PEUT PLUS
 *      être publiée sans description, là où `legendes.json` était facultatif et
 *      où le texte alternatif était alors GÉNÉRÉ (« Action ADEBES — éducation
 *      (photo 1) »). C'est un gain d'accessibilité réel (WCAG 1.1.1), et il est
 *      structurel plutôt que déclaratif.
 *   3. **Déposer un fichier sur le serveur ne suffit plus.** Il faut le
 *      téléverser dans la médiathèque puis l'ajouter à la galerie. C'est un
 *      geste de plus, et c'est le prix du reste : une photo cataloguée porte sa
 *      description, son auteur, ses usages et son statut.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ÉCART SIGNALÉ — CE FICHIER N'EST PAS ENCORE `'use cache'`
 * ---------------------------------------------------------------------------
 * Même situation qu'aux Lots 8A à 8G, pour la même raison : `'use cache'` est
 * une fonctionnalité de Cache Components, et le §0.4 du Rapport 2 écrit noir
 * sur blanc que `cacheComponents: true` n'est pas activé avant le Lot 15. La
 * lecture est donc dynamique en attendant, et `/galerie` porte
 * `export const dynamic = "force-dynamic"`.
 *
 * ⚠️  Ce n'est pas cosmétique ici : `/galerie` était **entièrement statique**
 * avant ce lot — sa grille était figée au build. Sans la directive, ajouter une
 * photo depuis le dashboard ne changerait rien à la page jusqu'au prochain
 * déploiement. C'est la deuxième page du projet dans ce cas, après `/impact`
 * (écart nº 131).
 *
 * **CE QUE LE LOT 15 AURA À FAIRE ICI** : `'use cache'` en première ligne de
 * chaque fonction, `cacheTag(ETIQUETTE_GALERIE)` et `cacheLife('days')`, puis
 * retirer le `force-dynamic` de la page. Les étiquettes sont déjà posées et
 * déjà invalidées par les deux fichiers d'actions.
 */

/** Étiquette de la collection entière. */
export const ETIQUETTE_GALERIE = "cms:galerie";

/** Étiquette de la page publique — nouvelle avec ce lot. */
export const ETIQUETTE_PAGE_GALERIE = "cms:page:galerie";

function portElements(): GalleryItemReadPort {
  return new SupabaseGalleryItemRepository(createPublicClient());
}

function portCategories(): GalleryCategoryReadPort {
  return new SupabaseGalleryCategoryRepository(createPublicClient());
}

/**
 * Les photos publiées, dans l'ordre de la grille.
 *
 * `cache()` de React mémoïse sur la durée d'UN rendu — ce n'est PAS un cache
 * entre requêtes, il ne remplace pas `'use cache'`.
 *
 * ---------------------------------------------------------------------------
 * UNE LECTURE EN ÉCHEC NE VIDE PAS LA GRILLE : ELLE LÈVE
 * ---------------------------------------------------------------------------
 * Même règle qu'aux sept lots précédents. Renvoyer `[]` en cas de panne ferait
 * disparaître la grille en silence — exactement le rendu d'une galerie sans
 * photo publiée, qui est un état légitime. Les deux situations produiraient le
 * même écran et personne ne saurait laquelle s'est produite. Next rend alors sa
 * frontière d'erreur, ce qui est le comportement voulu.
 */
export const getElementsGalerie = cache(async (): Promise<GalleryItem[]> => {
  const resultat = await listPublishedGalleryItems(portElements());
  if (!resultat.ok) throw resultat.error;
  return resultat.value;
});

/**
 * Toutes les catégories, dans l'ordre des boutons de filtre.
 *
 * ⚠️  Elles sont renvoyées TOUTES, y compris celles qu'aucune photo publiée
 * n'emploie. La sélection de celles qui méritent un bouton est faite par
 * `categoriesAffichees()`, **dans le domaine** : c'est une règle d'affichage,
 * pas une règle de lecture, et la page du dashboard qui explique le
 * comportement doit pouvoir appliquer la même.
 */
export const getCategoriesGalerie = cache(
  async (): Promise<GalleryCategory[]> => {
    const resultat = await listGalleryCategories(portCategories());
    if (!resultat.ok) throw resultat.error;
    return resultat.value;
  },
);
