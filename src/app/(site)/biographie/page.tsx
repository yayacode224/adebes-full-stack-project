import { ArrowRight, Info } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ValueCard } from "@/components/cards/value-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { MediaImage } from "@/components/media/media-image";
import { JsonLd, breadcrumbJsonLd, personJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { PlaceholderBadge } from "@/components/ui-ext/placeholder-badge";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import {
  biographie,
  domainesEngagement,
  engagementsBiographie,
} from "@/content/biographie";
import { resolveMedia } from "@/lib/media";

export const metadata: Metadata = {
  title: "Biographie",
  description: `${biographie.name} — ${biographie.resume}`,
  alternates: { canonical: "/biographie" },
  openGraph: {
    title: `Biographie de ${biographie.name} · ADEBES`,
    description: biographie.resume,
    url: "/biographie",
  },
};

export default function BiographiePage() {
  /**
   * Le portrait n'est déclaré dans les données structurées que s'il a
   * réellement été déposé : même règle que pour les rapports de la page
   * Impact — on ne référence jamais un fichier qui n'existe pas.
   */
  const portrait = resolveMedia(biographie.media.portrait);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Biographie", href: "/biographie" },
        ])}
      />
      <JsonLd
        data={personJsonLd({
          name: biographie.name,
          jobTitle: biographie.role,
          description: biographie.resume,
          path: "/biographie",
          image: portrait.available ? portrait.src : undefined,
        })}
      />

      <PageHero
        eyebrow="Biographie"
        title={biographie.name}
        subtitle={biographie.resume}
        image={biographie.media.cover}
        imageAlt={biographie.media.coverAlt}
        imageClassName={biographie.media.coverPosition}
        tone="navy"
      />

      {/* --- Présentation --- */}
      <section className="py-14 lg:py-20">
        <Container size="wide">
          {/*
            2/5 – 3/5 plutôt que deux colonnes égales : un portrait 3:4 sur une
            demi-largeur dépasserait 750 px de haut et écraserait le texte, qui
            est le contenu principal d'une biographie.
          */}
          <div className="grid items-start gap-10 lg:grid-cols-5 lg:gap-14">
            <Reveal className="lg:col-span-2">
              <div className="relative mx-auto aspect-[3/4] w-full max-w-md overflow-hidden rounded-2xl bg-muted lg:sticky lg:top-28 lg:mx-0 lg:max-w-none">
                <MediaImage
                  src={biographie.media.portrait}
                  alt={biographie.media.portraitAlt}
                  fill
                  kind="portrait"
                  tone="navy"
                  sizes="(min-width: 1024px) 38vw, (min-width: 640px) 28rem, 90vw"
                />
              </div>
            </Reveal>

            <Reveal delay={0.1} className="lg:col-span-3">
              <SectionHeading
                badge="Présentation"
                title="Un parcours au service du développement"
                subtitle={`${biographie.role} — ${biographie.country}.`}
              />

              <div className="mt-6 flex flex-col gap-4 text-[0.95rem] leading-relaxed text-muted-foreground">
                {biographie.presentation.map((paragraphe) => (
                  <p key={paragraphe}>{paragraphe}</p>
                ))}
              </div>

              <Button asChild variant="outline" className="mt-7">
                <Link href="/a-propos">
                  Découvrir l&apos;association
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* --- Domaines d'engagement --- */}
      <section className="bg-card py-14 lg:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              badge="Domaines d'activité"
              title="Quatre terrains d'engagement"
              align="center"
            />
          </Reveal>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {domainesEngagement.map((domaine, index) => (
              <Reveal as="li" key={domaine.title} delay={index * 0.06}>
                <ValueCard valeur={domaine} className="h-full" />
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* --- Action sociale et contribution --- */}
      <section className="py-14 lg:py-20">
        <Container size="default">
          <Reveal>
            <SectionHeading
              badge="Au-delà de l'économie"
              title="Une action tournée vers les personnes"
              subtitle="Les activités économiques ne résument pas son engagement : le soin apporté aux personnes malades et la contribution au développement du pays en font partie intégrante."
            />
          </Reveal>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2">
            {engagementsBiographie.map((engagement, index) => {
              const Icon = engagement.icon;

              return (
                <Reveal as="li" key={engagement.title} delay={index * 0.06}>
                  <div className="flex h-full gap-4 rounded-2xl border border-border bg-card p-5">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green/12 text-brand-green-ink dark:text-brand-green">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <div>
                      <h3 className="font-heading text-base font-semibold text-foreground">
                        {engagement.title}
                      </h3>
                      <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                        {engagement.description}
                      </p>
                    </div>
                  </div>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* --- Ce qui reste à fournir --- */}
      <section className="border-t border-border bg-card py-14 lg:py-20">
        <Container size="default">
          <Reveal>
            <div className="rounded-2xl border border-border bg-background p-6 sm:p-8">
              <PlaceholderBadge>Biographie à compléter</PlaceholderBadge>

              <h2 className="mt-4 font-heading text-xl font-semibold text-foreground sm:text-2xl">
                Informations en attente
              </h2>
              <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                Seuls les éléments transmis figurent sur cette page : aucune
                date ni aucune fonction n&apos;a été ajoutée par déduction. Les
                précisions suivantes viendront la compléter dès qu&apos;elles
                seront fournies.
              </p>

              <ul className="mt-5 flex flex-col gap-2.5">
                {biographie.informationsAFournir.map((information) => (
                  <li
                    key={information}
                    className="flex items-start gap-2.5 text-sm leading-relaxed text-muted-foreground"
                  >
                    <Info
                      className="mt-0.5 size-4 shrink-0 text-brand-orange-ink dark:text-brand-orange"
                      aria-hidden="true"
                    />
                    {information}
                  </li>
                ))}
              </ul>
            </div>
          </Reveal>
        </Container>
      </section>

      <CTABanner
        title="Soutenir les actions d'ADEBES"
        subtitle="Un don, quelques heures de bénévolat ou un simple message : chaque geste prolonge l'action menée sur le terrain."
      />
    </>
  );
}
