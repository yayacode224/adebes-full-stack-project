import { Download, FileText, MapPin, ShieldCheck } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { StatCard } from "@/components/cards/stat-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { rapports } from "@/content/equipe";
import { stats } from "@/content/stats";
import { resolveMedia } from "@/lib/media";
import { contact } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Impact & transparence",
  description:
    "Les chiffres d'ADEBES, l'utilisation des dons et les rapports d'activité téléchargeables. La transparence est ce qui rend un don possible.",
  alternates: { canonical: "/impact" },
  openGraph: {
    title: "Impact & transparence · ADEBES",
    description: "Nos chiffres, nos engagements, nos rapports d'activité.",
    url: "/impact",
  },
};

const engagements = [
  {
    title: "Chaque don est affecté",
    description:
      "Un don est rattaché à un programme identifié. Vous pouvez préciser lequel au moment de votre contact.",
  },
  {
    title: "Un rapport sur demande",
    description:
      "Tout donateur peut demander le détail de l'utilisation de son don. La demande se fait par e-mail ou WhatsApp.",
  },
  {
    title: "Des chiffres vérifiables",
    description:
      "Nous ne publions que des chiffres issus de nos rapports d'activité. Un chiffre non consolidé n'est pas affiché.",
  },
  {
    title: "Aucune collecte cachée",
    description:
      "Le site ne collecte aucune donnée à votre insu. Les seules informations reçues sont celles que vous nous transmettez volontairement.",
  },
];

export default function ImpactPage() {
  /**
   * Un rapport n'est proposé au téléchargement que si le PDF a réellement été
   * déposé dans /public/documents/ : jamais de lien de téléchargement mort.
   */
  const rapportsDisponibles = rapports.map((rapport) => ({
    ...rapport,
    available: resolveMedia(rapport.file).available,
  }));

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Impact & transparence", href: "/impact" },
        ])}
      />

      <PageHero
        eyebrow="Impact & transparence"
        title="Ce que votre soutien permet"
        subtitle="Une association qui vit de la générosité du public doit rendre des comptes. Voici nos chiffres, nos engagements et nos documents."
        image="/images/hero/hero-impact.jpeg"
        imageAlt="Bénéficiaires d'un programme d'ADEBES au Cameroun"
        tone="navy"
      />

      {/* --- Chiffres --- */}
      <section className="py-14 lg:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              title="Nos chiffres"
              subtitle="Chaque valeur est accompagnée de sa source. Les chiffres en attente de consolidation sont signalés plutôt qu'arrondis au hasard."
            />
          </Reveal>

          <ul className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {stats.map((stat, index) => (
              <Reveal as="li" key={stat.key} delay={index * 0.06}>
                <div className="flex h-full flex-col">
                  <StatCard stat={stat} />
                  {stat.note ? (
                    <p className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground">
                      {stat.note}
                    </p>
                  ) : null}
                </div>
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* --- Engagements --- */}
      <section className="bg-card py-14 lg:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              badge="Nos engagements"
              title="Quatre règles que nous nous imposons"
              align="center"
            />
          </Reveal>

          <ul className="mt-10 grid gap-4 sm:grid-cols-2">
            {engagements.map((engagement, index) => (
              <Reveal as="li" key={engagement.title} delay={index * 0.06}>
                <div className="flex h-full gap-4 rounded-2xl border border-border bg-background p-5">
                  <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-brand-green/12 text-brand-green-ink dark:text-brand-green">
                    <ShieldCheck className="size-5" aria-hidden="true" />
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
            ))}
          </ul>
        </Container>
      </section>

      {/* --- Rapports --- */}
      <section className="py-14 lg:py-20">
        <Container size="default">
          <Reveal>
            <SectionHeading
              badge="Documents"
              title="Rapports d'activité"
              subtitle="L'ancien site promettait un rapport envoyé sur demande sans rien publier. Les rapports validés sont désormais téléchargeables directement ici."
            />
          </Reveal>

          <ul className="mt-8 flex flex-col gap-3">
            {rapportsDisponibles.map((rapport, index) => (
              <Reveal as="li" key={rapport.year} delay={index * 0.06}>
                <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-border bg-card p-5">
                  <div className="flex min-w-0 items-center gap-3">
                    <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
                      <FileText className="size-5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                      <p className="font-heading text-base font-semibold text-foreground">
                        {rapport.title}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {rapport.available
                          ? "Format PDF"
                          : "En cours de préparation"}
                      </p>
                    </div>
                  </div>

                  {rapport.available ? (
                    <Button asChild variant="outline" size="sm">
                      <a href={rapport.file} download>
                        <Download className="size-4" aria-hidden="true" />
                        Télécharger
                      </a>
                    </Button>
                  ) : (
                    <span className="rounded-full border border-border px-3 py-1.5 text-xs text-muted-foreground">
                      Bientôt disponible
                    </span>
                  )}
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.1}>
            <p className="mt-6 text-sm text-muted-foreground">
              Vous souhaitez le détail de l&apos;utilisation d&apos;un don ?{" "}
              <a
                href={`mailto:${contact.email}`}
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                {contact.email}
              </a>
            </p>
          </Reveal>
        </Container>
      </section>

      {/* --- Zones d'intervention --- */}
      <section className="border-t border-border bg-card py-14 lg:py-20">
        <Container size="default">
          <Reveal>
            <SectionHeading
              badge="Où nous agissons"
              title="Nos zones d'intervention"
              align="center"
            />
          </Reveal>

          <ul className="mx-auto mt-10 grid max-w-3xl gap-4 sm:grid-cols-3">
            {[
              {
                name: "Douala",
                detail: "Siège de l'association et actions urbaines",
              },
              { name: "Yaoundé", detail: "Programmes éducatifs et sociaux" },
              {
                name: "Régions de l'intérieur",
                detail: "Campagnes de santé et actions rurales",
              },
            ].map((zone, index) => (
              <Reveal as="li" key={zone.name} delay={index * 0.06}>
                <div className="flex h-full flex-col items-center gap-2 rounded-2xl border border-border bg-background p-5 text-center">
                  <MapPin
                    className="size-5 text-brand-green-ink dark:text-brand-green"
                    aria-hidden="true"
                  />
                  <p className="font-heading text-base font-semibold text-foreground">
                    {zone.name}
                  </p>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    {zone.detail}
                  </p>
                </div>
              </Reveal>
            ))}
          </ul>

          <Reveal delay={0.12}>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Voir le détail par programme sur la page{" "}
              <Link
                href="/programmes"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Nos programmes
              </Link>
              .
            </p>
          </Reveal>
        </Container>
      </section>

      <CTABanner
        title="La transparence appelle la confiance"
        subtitle="Et la confiance permet d'agir. Soutenez un programme, ou venez voir par vous-même."
      />
    </>
  );
}
