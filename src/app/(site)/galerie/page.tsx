import type { Metadata } from "next";

import { SectionsRenderer } from "@/components/blocks/section-renderer";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { getPagePublique } from "@/server/queries/pages.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /galerie — BASCULÉE SUR LA BASE (§8H), PUIS SUR LES SECTIONS (§9.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * LA GRILLE ET LA VIDÉO SONT DÉSORMAIS DEUX SECTIONS
 * ---------------------------------------------------------------------------
 * getElementsGalerie()/getCategoriesGalerie() sont appelés par
 * <GalleryPreviewRenderer>, pas ici. Les trois décisions d'affichage prises
 * au Lot 8H (catégories vides masquées, photo sans catégorie visible dans
 * « Tous », section entière disparue si aucune photo publiée) vivent
 * maintenant dans ce Renderer — reprises telles quelles, pas réécrites.
 *
 * showFilters: true sur la section migrée conserve le filtre par catégorie
 * et la visionneuse au clavier : c'est la seule page où ce réglage est activé,
 * parce que c'est la seule où la galerie EST le sujet de la page.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  force-dynamic — SECONDE PAGE ENTIÈREMENT STATIQUE QUE LE CMS CONVERTIT
 * ---------------------------------------------------------------------------
 * Comme /impact au Lot 8G (écart nº 131) : cette page ne lisait rien de la
 * base avant le Lot 8H. Sans la directive, la page serait prérendue au build
 * et une photo ajoutée depuis le dashboard ne changerait rien jusqu'au
 * prochain déploiement.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Galerie",
  description:
    "Photos et vidéos des actions d'ADEBES au Cameroun : éducation, santé, développement communautaire et protection de l'environnement.",
  alternates: { canonical: "/galerie" },
  openGraph: {
    title: "Galerie · ADEBES",
    description: "Les actions d'ADEBES en images.",
    url: "/galerie",
  },
};

export default async function GaleriePage() {
  const page = await getPagePublique("/galerie");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Galerie", href: "/galerie" },
        ])}
      />

      <PageHero
        eyebrow="Galerie"
        title="Nos actions en images"
        subtitle="Des photos prises sur le terrain, classées par domaine d'intervention."
        image="/images/hero/hero-galerie.jpeg"
        imageAlt="Moment de terrain lors d'une action d'ADEBES"
        tone="green"
      />

      <SectionsRenderer
        sections={page?.sections ?? []}
        page={page ?? { slug: "galerie", route: "/galerie", title: "Galerie" }}
      />

      <CTABanner
        title="Ces images vous parlent ?"
        subtitle="Elles représentent des actions concrètes, financées par des dons et menées par des bénévoles."
      />
    </>
  );
}
