import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { GalleryClient } from "@/components/dashboard/gallery/gallery-client";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { can } from "@/core/rbac/policy";
import { listGalleryItems } from "@/core/use-cases/gallery/list-gallery-items";
import { listGalleryCategories } from "@/core/use-cases/gallery/manage-gallery-categories";
import { getMediaByIds } from "@/core/use-cases/media/get-media";
import { requirePermission } from "@/server/dal/session";
import {
  galleryCategoryReadPort,
  galleryItemReadPort,
} from "@/server/deps/gallery.deps";
import { mediaReadPort } from "@/server/deps/media.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/galerie
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8H du Rapport 2, sur le gabarit du §8A.3. L'entrée de navigation existait
 * depuis le Lot 5 (`dashboard-navigation.ts`, permission `gallery:read`) et
 * menait jusqu'ici à une 404 : ce lot lui donne sa destination.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc des ports
 * de LECTURE à `server/deps/`. Le nom `SupabaseGalleryItemRepository`
 * n'apparaît nulle part ici.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  TROIS LECTURES, ET AUCUNE N'EST FACULTATIVE
 * ---------------------------------------------------------------------------
 * C'est l'écran le plus « joint » du Lot 8, et cela découle de la table :
 *
 *   1. **les éléments** — la collection elle-même ;
 *   2. **les catégories** — pour afficher un libellé plutôt qu'un UUID, et
 *      alimenter le filtre comme la modale de gestion ;
 *   3. **les médias** — parce qu'un élément de galerie ne porte AUCUN texte.
 *      Sans cette troisième lecture, la liste afficherait une colonne
 *      « Description » vide et la recherche n'aurait rien à chercher.
 *
 * Les deux dernières sont tolérantes à l'échec (liste vide) ; la première ne
 * l'est pas. La différence est celle du Lot 8A : sans les éléments il n'y a pas
 * d'écran, alors qu'une vignette manquante est un état que l'interface sait
 * dire.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire (§15, règle 10 du Rapport 1). Et elle ne doit
 * surtout pas être mise en cache — une photo publiée il y a dix secondes doit
 * apparaître avec son nouvel état.
 */
export const metadata: Metadata = {
  title: "Galerie",
};

/**
 * Toutes les photos, brouillons compris.
 *
 * ⚠️  La borne compte ici plus qu'ailleurs. `<DataTable>` filtre, trie et
 * pagine en mémoire (§6.1), ce qui suppose que la collection tienne dans une
 * page — hypothèse raisonnable pour huit programmes, moins évidente pour une
 * galerie, qui est la collection la plus susceptible de grossir du projet
 * (l'association dépose des photos après chaque action de terrain).
 *
 * `MAX_PAGE_SIZE` vaut 100, et l'écran DIT le total dès qu'il dépasse ce qui
 * est chargé — même règle qu'au Lot 8B pour les articles (écart nº 79). Le jour
 * où le total approche la centaine, le filtrage passera côté serveur ; le dépôt
 * sait déjà paginer.
 */
const TAILLE_PAGE = 100;

export default async function GaleriePage() {
  const actor = await requirePermission("gallery:read");

  const read = await galleryItemReadPort();
  const elements = await listGalleryItems(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "position",
    sortDirection: "asc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a
    aucune photo » et « on n'a pas pu les lire » ne sont pas la même
    information, et les confondre est exactement ce que l'invariant nº 1
    interdit. Le second appelle « Réessayer », le premier « Ajouter ».
  */
  if (!elements.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Galerie"
          description="Les photos de la page Galerie."
        />
        <ErrorState
          title="La liste des photos n'a pas pu être chargée"
          message={elements.error.message}
        />
      </div>
    );
  }

  /*
    Les catégories. Un échec renvoie une liste vide plutôt qu'un écran
    d'erreur : la liste des photos reste parfaitement utilisable sans elles —
    chaque ligne affichera « Sans catégorie », ce qui est le comportement du
    domaine pour une catégorie introuvable. Ne pas montrer est moins grave que
    tomber.
  */
  const categories = await listGalleryCategories(await galleryCategoryReadPort());

  /*
    Les photos. `media_id` est `not null`, il n'y a donc pas d'identifiant à
    filtrer — contrairement aux programmes, dont la couverture est facultative.
    Le `Set` reste utile : une même photo peut légitimement figurer deux fois.
  */
  const identifiants = [
    ...new Set(elements.value.items.map((element) => element.mediaId)),
  ];

  const resolus = await getMediaByIds(await mediaReadPort(), identifiants);

  const medias: Record<string, MediaAsset> = {};
  if (resolus.ok) {
    for (const media of resolus.value) medias[media.id] = media;
  }

  return (
    <GalleryClient
      elements={elements.value.items}
      medias={medias}
      categories={categories.ok ? categories.value : []}
      total={elements.value.total}
      peutCreer={can(actor, "gallery:create")}
      peutModifier={can(actor, "gallery:update")}
      peutPublier={can(actor, "gallery:publish")}
      peutSupprimer={can(actor, "gallery:delete")}
      peutReordonner={can(actor, "gallery:reorder")}
    />
  );
}
