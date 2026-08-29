import { ArrowRight, Building, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { ValueCard } from "@/components/cards/value-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { MediaImage } from "@/components/media/media-image";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { PlaceholderBadge } from "@/components/ui-ext/placeholder-badge";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { equipe, membrePhoto } from "@/content/equipe";
import { valeurs } from "@/content/valeurs";
import { legal, siteConfig, TODO } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description:
    "ADEBES, association camerounaise à but non lucratif : mission, valeurs, équipe et gouvernance. Une action de terrain menée avec les communautés de Douala, Yaoundé et des régions de l'intérieur.",
  alternates: { canonical: "/a-propos" },
  openGraph: {
    title: "Qui sommes-nous · ADEBES",
    description: "Mission, valeurs, équipe et gouvernance de l'association.",
    url: "/a-propos",
  },
};

export default function AProposPage() {
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Qui sommes-nous", href: "/a-propos" },
        ])}
      />

      <PageHero
        eyebrow="Qui sommes-nous"
        title="Une association née du terrain"
        subtitle={siteConfig.description}
        image="/images/hero/hero-a-propos.jpeg"
        imageAlt="Membres et bénévoles d'ADEBES au Cameroun"
        tone="navy"
      />

      {/* --- Mission --- */}
      <section className="py-14 lg:py-20">
        <Container size="wide">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <SectionHeading
                badge="Notre mission"
                title="Agir avec les communautés, pas à leur place"
                subtitle="ADEBES est une organisation camerounaise à but non lucratif qui intervient dans l'éducation, la santé, l'inclusion sociale et le développement communautaire."
              />

              <div className="mt-6 flex flex-col gap-4 text-[0.95rem] leading-relaxed text-muted-foreground">
                <p>
                  Nous intervenons principalement à Douala et Yaoundé, ainsi que
                  dans les régions de l&apos;intérieur du Cameroun, là où les
                  besoins identifiés avec les habitants ne trouvent pas de
                  réponse.
                </p>
                <p>
                  Nos huit programmes sont complémentaires : soutenir la
                  scolarité d&apos;un enfant a peu de sens si sa famille n&apos;a
                  pas accès aux soins, et former une femme à un métier suppose
                  qu&apos;elle dispose d&apos;un capital de départ. C&apos;est
                  cette articulation qui fait notre méthode.
                </p>
              </div>

              <Button asChild variant="outline" className="mt-7">
                <Link href="/programmes">
                  Découvrir nos 8 programmes
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>

            <Reveal delay={0.1}>
              <div className="grid grid-cols-2 gap-3">
                <div className="relative aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                  <MediaImage
                    src="/images/a-propos/histoire-01.jpeg"
                    alt="Action de terrain menée par ADEBES auprès d'une communauté"
                    fill
                    tone="blue"
                    sizes="(min-width: 1024px) 22vw, 45vw"
                  />
                </div>
                <div className="relative mt-8 aspect-[3/4] overflow-hidden rounded-2xl bg-muted">
                  <MediaImage
                    src="/images/a-propos/histoire-02.jpeg"
                    alt="Bénévoles d'ADEBES lors d'une distribution de matériel"
                    fill
                    tone="green"
                    sizes="(min-width: 1024px) 22vw, 45vw"
                  />
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* --- Valeurs --- */}
      <section className="bg-card py-14 lg:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              badge="Nos valeurs"
              title="Quatre principes, appliqués au quotidien"
              align="center"
            />
          </Reveal>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {valeurs.map((valeur, index) => (
              <Reveal as="li" key={valeur.title} delay={index * 0.06}>
                <ValueCard valeur={valeur} className="h-full" />
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* --- Équipe --- */}
      <section className="py-14 lg:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              badge="L'équipe"
              title="Celles et ceux qui portent l'association"
              subtitle="Savoir qui dirige une association est un signal de confiance au moins aussi important qu'un chiffre d'impact."
            />
          </Reveal>

          <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {equipe.map((membre, index) => (
              <Reveal as="li" key={membre.id} delay={index * 0.06}>
                <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card">
                  <div className="relative aspect-[4/3] bg-muted">
                    <MediaImage
                      src={membrePhoto(membre.id)}
                      alt={`Portrait de ${membre.name === TODO ? "un membre de l'équipe ADEBES" : membre.name}`}
                      fill
                      kind="portrait"
                      tone="neutral"
                      sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
                    />
                  </div>

                  <div className="flex flex-1 flex-col gap-2 p-5">
                    <p className="font-heading text-base font-semibold text-foreground">
                      {membre.name}
                    </p>
                    <p className="text-sm font-medium text-primary">
                      {membre.role}
                    </p>
                    {membre.bio ? (
                      <p className="text-sm leading-relaxed text-muted-foreground">
                        {membre.bio}
                      </p>
                    ) : null}
                    {membre.placeholder ? (
                      <PlaceholderBadge className="mt-auto w-fit">
                        Nom et photo à fournir
                      </PlaceholderBadge>
                    ) : null}
                  </div>
                </div>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* --- Gouvernance --- */}
      <section className="border-t border-border bg-card py-14 lg:py-20">
        <Container size="default">
          <Reveal>
            <SectionHeading
              badge="Gouvernance"
              title="Statut et transparence"
              subtitle="Les informations légales complètes figurent dans les mentions légales et sur la page Impact."
            />
          </Reveal>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Reveal>
              <div className="flex h-full gap-4 rounded-2xl border border-border bg-background p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                  <Building className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Statut juridique
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Association camerounaise à but non lucratif.
                    <br />
                    Numéro d&apos;enregistrement : {legal.registrationNumber}
                  </p>
                </div>
              </div>
            </Reveal>

            <Reveal delay={0.08}>
              <div className="flex h-full gap-4 rounded-2xl border border-border bg-background p-5">
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green/12 text-brand-green-ink dark:text-brand-green">
                  <ShieldCheck className="size-5" aria-hidden="true" />
                </span>
                <div>
                  <h3 className="font-heading text-base font-semibold text-foreground">
                    Redevabilité
                  </h3>
                  <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
                    Rapports d&apos;activité publiés et chiffres sourcés sur la{" "}
                    <Link
                      href="/impact"
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      page Impact &amp; transparence
                    </Link>
                    .
                  </p>
                </div>
              </div>
            </Reveal>
          </div>
        </Container>
      </section>

      <CTABanner
        title="Vous partagez nos valeurs ?"
        subtitle="Il y a autant de façons d'aider que de programmes. Commencez par celle qui vous ressemble."
      />
    </>
  );
}
