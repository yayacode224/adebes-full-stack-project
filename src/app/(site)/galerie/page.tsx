import type { Metadata } from "next";

import { GalleryGrid } from "@/components/galerie/gallery-grid";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { MediaImage } from "@/components/media/media-image";
import { VideoEmbed } from "@/components/media/video-embed";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { galerieCategories, getGalerieItems } from "@/content/galerie";

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

export default function GaleriePage() {
  const items = getGalerieItems();

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

      <section className="py-14 lg:py-20">
        <Container size="wide">
          <GalleryGrid
            categories={galerieCategories.map(({ slug, label }) => ({
              slug,
              label,
            }))}
            entries={items.map((item) => ({
              id: item.id,
              category: item.category,
              categoryLabel: item.categoryLabel,
              alt: item.alt,
              thumb: (
                <MediaImage
                  src={item.src}
                  alt={item.alt}
                  fill
                  tone={item.tone}
                  compactPlaceholder
                  sizes="(min-width: 1024px) 22vw, (min-width: 640px) 30vw, 45vw"
                  className="transition-transform duration-500 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                />
              ),
              full: (
                <MediaImage
                  src={item.src}
                  alt={item.alt}
                  fill
                  tone={item.tone}
                  sizes="(min-width: 1024px) 60vw, 100vw"
                  className="object-contain"
                />
              ),
            }))}
          />
        </Container>
      </section>

      {/* --- Vidéo --- */}
      <section className="border-t border-border bg-card py-14 lg:py-20">
        <Container size="default">
          <Reveal>
            <SectionHeading
              badge="Vidéo"
              title="ADEBES en mouvement"
              subtitle="Les vidéos sont hébergées sur une plateforme externe et chargées uniquement au clic : aucune donnée mobile n'est consommée avant que vous ne lanciez la lecture."
              align="center"
            />
          </Reveal>

          <Reveal delay={0.1}>
            <div className="mx-auto mt-10 max-w-3xl">
              <VideoEmbed
                // Renseignez ici l'identifiant de la vidéo une fois publiée :
                // { provider: "youtube", id: "xxxxxxxxxxx" }
                source={null}
                title="Présentation d'ADEBES"
                poster="/images/galerie/video-poster.jpg"
                posterAlt="Image d'aperçu de la vidéo de présentation d'ADEBES"
                tone="navy"
              />
            </div>
          </Reveal>
        </Container>
      </section>

      <CTABanner
        title="Ces images vous parlent ?"
        subtitle="Elles représentent des actions concrètes, financées par des dons et menées par des bénévoles."
      />
    </>
  );
}
