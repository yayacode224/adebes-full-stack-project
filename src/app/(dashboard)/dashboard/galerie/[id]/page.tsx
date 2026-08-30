import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { GalleryItemEditeur } from "@/components/dashboard/gallery/gallery-item-editeur";
import type { GalleryItem } from "@/core/cms/entities/gallery";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { galleryItemIdSchema } from "@/core/cms/schemas/gallery.schema";
import { can } from "@/core/rbac/policy";
import { getGalleryItemById } from "@/core/use-cases/gallery/get-gallery-item";
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
 *  /dashboard/galerie/[id]
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL, donc de n'importe qui. Sans cette vérification,
 * `/dashboard/galerie/bonjour` produirait une erreur PostgREST 22P02
 * (« invalid input syntax for type uuid ») remontée en écran d'erreur
 * technique, là où la réponse juste est une 404 — la même que pour un élément
 * réellement supprimé.
 *
 * ---------------------------------------------------------------------------
 * `params` EST UNE PROMESSE (Next.js 16, §15 du Rapport 1)
 * ---------------------------------------------------------------------------
 * `const { id } = await params`. C'est la règle nº 3 des contraintes
 * anti-hallucination, et elle vaut aussi dans `generateMetadata`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE TITRE DE L'ONGLET VIENT DU MÉDIA, PAS DE L'ÉLÉMENT
 * ---------------------------------------------------------------------------
 * Un élément de galerie n'a aucun texte : `generateMetadata` doit donc résoudre
 * la photo pour nommer l'onglet. C'est le seul écran du Lot 8 dans ce cas, et
 * cela justifie que la résolution du média soit MÉMOÏSÉE au même titre que la
 * lecture de l'élément — sans quoi chaque affichage produirait deux requêtes
 * identiques vers `media_assets`.
 *
 * À défaut de description, l'onglet porte le nom du fichier, puis « Photo de la
 * galerie ». Aucun de ces replis n'invente de contenu : ils nomment ce qui
 * existe, dans l'ordre de ce qui est le plus parlant.
 */

/**
 * La lecture de l'élément, mémoïsée sur la durée d'UN rendu.
 *
 * `generateMetadata` et la page demandent le même élément : sans `cache()`,
 * chaque affichage produirait deux requêtes identiques.
 */
const lireElement = cache(
  async (identifiant: string): Promise<GalleryItem | null> => {
    const analyse = galleryItemIdSchema.safeParse({ id: identifiant });
    if (!analyse.success) return null;

    const resultat = await getGalleryItemById(
      await galleryItemReadPort(),
      analyse.data.id,
    );

    if (resultat.ok) return resultat.value;
    // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
    // Toute autre erreur est une panne et doit remonter telle quelle.
    if (resultat.error.code === "NOT_FOUND") return null;
    throw resultat.error;
  },
);

/**
 * La photo, mémoïsée elle aussi.
 *
 * Un échec renvoie `null` plutôt que de lever : l'élément reste modifiable sans
 * sa vignette, et l'écran DIT que la photo n'a pas pu être chargée. Faire
 * tomber la page parce qu'une image manque serait une régression — c'est la
 * règle posée par `media.query.ts` au Lot 7, transposée au dashboard.
 */
const lireMedia = cache(async (mediaId: string): Promise<MediaAsset | null> => {
  const resultat = await getMediaByIds(await mediaReadPort(), [mediaId]);
  if (!resultat.ok) return null;
  return resultat.value[0] ?? null;
});

export async function generateMetadata(
  props: PageProps<"/dashboard/galerie/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait la description d'une photo en brouillon à
  // un compte non autorisé.
  await requirePermission("gallery:read");

  const element = await lireElement(id);
  if (!element) return { title: "Photo introuvable" };

  const media = await lireMedia(element.mediaId);

  return {
    title: media?.altText || media?.filename || "Photo de la galerie",
  };
}

export default async function ElementGaleriePage(
  props: PageProps<"/dashboard/galerie/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("gallery:read");

  const element = await lireElement(id);
  if (!element) notFound();

  const [media, categories] = await Promise.all([
    lireMedia(element.mediaId),
    listGalleryCategories(await galleryCategoryReadPort()),
  ]);

  return (
    <GalleryItemEditeur
      element={element}
      media={media}
      categories={categories.ok ? categories.value : []}
      peutModifier={can(actor, "gallery:update")}
      peutPublier={can(actor, "gallery:publish")}
      peutSupprimer={can(actor, "gallery:delete")}
    />
  );
}
