import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { GalleryGrid } from "@/components/galerie/gallery-grid";
import { CmsImage } from "@/components/media/cms-image";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui-ext/reveal";
import type { GalleryPreviewContent } from "@/core/cms/blocks/definitions/gallery-preview.block";
import {
  categoriesAffichees,
  libelleDeLaCategorie,
  teinteDeLElement,
} from "@/core/cms/entities/gallery";
import { cn } from "@/lib/utils";
import {
  getCategoriesGalerie,
  getElementsGalerie,
} from "@/server/queries/gallery.query";
import { resoudreMedias } from "@/server/queries/media.query";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Aperçu de la galerie ».
 *
 * ---------------------------------------------------------------------------
 * DEUX FORMES, ET LE RÉGLAGE `showFilters` DÉCIDE
 * ---------------------------------------------------------------------------
 * Avec filtres, c'est `<GalleryGrid>` — un composant CLIENT, avec ses onglets
 * de catégorie et sa visionneuse au clavier. Sans filtres, c'est une grille
 * statique, qui convient à un aperçu posé au milieu d'une page éditoriale où
 * une barre de filtres serait hors sujet.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE CATÉGORIE INCONNUE VAUT « TOUTES », ELLE NE VIDE PAS LA SECTION
 * ---------------------------------------------------------------------------
 * Les catégories sont gérables depuis `/dashboard/galerie` : celle qu'une
 * section désigne peut avoir été supprimée. Rendre une grille vide aurait fait
 * disparaître les photos sans que rien ne l'explique — le symptôme d'une
 * suppression faite ailleurs, des semaines plus tôt.
 *
 * ⚠️  Les éléments dont le média est INTROUVABLE sont écartés, comme le fait
 * déjà `/galerie` depuis le Lot 8H : une vignette de repli dans une grille de
 * photos ressemble à une panne, pas à un contenu.
 */
export async function GalleryPreviewRenderer({
  content,
}: ProprietesDeRendu<GalleryPreviewContent>) {
  const [elements, categories] = await Promise.all([
    getElementsGalerie(),
    getCategoriesGalerie(),
  ]);

  const medias = await resoudreMedias(elements.map((element) => element.mediaId));
  const affichables = elements.filter((element) => medias.has(element.mediaId));

  const categorieChoisie = content.categorySlug
    ? categories.find((categorie) => categorie.slug === content.categorySlug)
    : undefined;

  const filtres = categorieChoisie
    ? affichables.filter((element) => element.categoryId === categorieChoisie.id)
    : affichables;

  const retenus =
    content.limit === null ? filtres : filtres.slice(0, content.limit);

  if (retenus.length === 0) return null;

  return (
    <BlockSection id="galerie" entete={content} espacement="page">
      <div className={cn(enteteEstVide(content) ? undefined : "mt-8")}>
        {content.showFilters ? (
          <GalleryGrid
            categories={categoriesAffichees(retenus, categories).map(
              (categorie) => ({ slug: categorie.id, label: categorie.label }),
            )}
            entries={retenus.map((element) => {
              const media = medias.get(element.mediaId)!;
              const teinte = teinteDeLElement(element, categories);

              return {
                id: element.id,
                /*
                  `""` pour un élément sans catégorie : aucun bouton ne porte
                  cette valeur, il n'apparaît donc que dans « Tous ». C'est la
                  règle `apparaitDansUnFiltre()` rendue par la donnée
                  elle-même, sans condition supplémentaire dans la grille.
                */
                category: element.categoryId ?? "",
                categoryLabel: libelleDeLaCategorie(element, categories),
                alt: media.altText,
                thumb: (
                  <CmsImage
                    asset={media}
                    fill
                    tone={teinte}
                    compactPlaceholder
                    sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                    className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                ),
                full: (
                  <CmsImage
                    asset={media}
                    fill
                    tone={teinte}
                    sizes="(min-width: 1024px) 60vw, 100vw"
                    className="object-contain"
                  />
                ),
              };
            })}
          />
        ) : (
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {retenus.map((element, index) => (
              <Reveal as="li" key={element.id} delay={index * 0.05}>
                <figure className="overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="relative aspect-[4/3] bg-muted">
                    <CmsImage
                      asset={medias.get(element.mediaId)}
                      fill
                      tone={teinteDeLElement(element, categories)}
                      sizes="(min-width: 1024px) 25vw, (min-width: 640px) 45vw, 90vw"
                    />
                  </div>
                  {/*
                    La légende reprend le TEXTE ALTERNATIF du média, saisi une
                    fois par la personne qui connaît la photo (Lot 7).
                    `gallery_items` ne porte pas de titre propre : la légende
                    d'une photo est la description de la photo.
                  */}
                  <figcaption className="px-3 py-2.5 text-xs leading-relaxed text-muted-foreground">
                    {medias.get(element.mediaId)?.altText}
                  </figcaption>
                </figure>
              </Reveal>
            ))}
          </ul>
        )}
      </div>

      {content.ctaLabel && content.ctaHref ? (
        <Reveal delay={0.12}>
          <div className="mt-8 flex justify-center">
            <Button asChild variant="outline">
              <Link href={content.ctaHref}>
                {content.ctaLabel}
                <ArrowRight className="size-4" aria-hidden="true" />
              </Link>
            </Button>
          </div>
        </Reveal>
      ) : null}
    </BlockSection>
  );
}
