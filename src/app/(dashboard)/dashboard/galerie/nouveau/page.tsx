import type { Metadata } from "next";

import { GalleryItemForm } from "@/components/dashboard/gallery/gallery-item-form";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { listGalleryCategories } from "@/core/use-cases/gallery/manage-gallery-categories";
import { requirePermission } from "@/server/dal/session";
import { galleryCategoryReadPort } from "@/server/deps/gallery.deps";

/**
 * /dashboard/galerie/nouveau — §8H.
 *
 * `gallery:create`, et non `gallery:update` : un éditeur crée et modifie, mais
 * la permission exigée doit être celle de l'action réelle. La Server Action
 * revérifie la même — c'est la deuxième barrière du §9 — et la RLS la
 * troisième.
 *
 * ---------------------------------------------------------------------------
 * UNE PHOTO NAÎT TOUJOURS EN BROUILLON
 * ---------------------------------------------------------------------------
 * Comme aux Lots 8C, 8D et 8F : `createGalleryItemSchema` ne transporte même
 * pas `status`, et le cas d'usage écrit `'draft'` en dur — de sorte qu'aucune
 * requête, fût-elle celle d'un super administrateur, ne puisse mettre une photo
 * en ligne sans passer par `setGalleryItemStatus`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE LECTURE AVANT LE RENDU, CONTRAIREMENT AU LOT 8F
 * ---------------------------------------------------------------------------
 * Le formulaire porte un `select` dont les options sont DYNAMIQUES : les
 * catégories de galerie sont gérables depuis la modale de la liste. Elles sont
 * donc lues ici et passées en props — c'est la règle de l'écart nº 40 : les
 * options d'un champ de référence sont FOURNIES par l'écran, jamais chargées
 * paresseusement par le champ.
 *
 * Un échec de lecture rend une liste vide plutôt qu'un écran d'erreur : on peut
 * parfaitement ajouter une photo sans la classer — c'est même l'ordre naturel
 * du travail — et le `hint` du champ dit alors où créer une catégorie.
 */
export const metadata: Metadata = {
  title: "Ajouter une photo",
};

export default async function NouvelElementGaleriePage() {
  await requirePermission("gallery:create");

  const categories = await listGalleryCategories(await galleryCategoryReadPort());

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ajouter une photo à la galerie"
        description="Choisissez une image déjà téléversée dans la médiathèque. L'élément est enregistré en brouillon : il ne sera visible sur la page Galerie qu'une fois publié."
      />

      <GalleryItemForm categories={categories.ok ? categories.value : []} />
    </div>
  );
}
