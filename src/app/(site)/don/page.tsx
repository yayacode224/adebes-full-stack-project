import { Building2, CreditCard, Mail, Smartphone } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { DonationAmounts } from "@/components/don/donation-amounts";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import {
  JsonLd,
  breadcrumbJsonLd,
  faqJsonLd,
} from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { FAQAccordion } from "@/components/ui-ext/faq-accordion";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { ContentIcon } from "@/components/ui-ext/content-icon";
import { faqByTopic } from "@/content/faq";
import { contact } from "@/lib/site-config";
import { getProgrammesPublies } from "@/server/queries/programmes.query";

export const metadata: Metadata = {
  title: "Faire un don",
  description:
    "Soutenez les programmes d'ADEBES au Cameroun. Don par WhatsApp, e-mail, Mobile Money ou virement : chaque contribution est affectée à un programme identifié.",
  alternates: { canonical: "/don" },
  openGraph: {
    title: "Faire un don · ADEBES",
    description:
      "Chaque don finance une action concrète : scolarité, campagne de santé, aide alimentaire, formation.",
    url: "/don",
  },
};

const faqDon = faqByTopic("don");

/**
 * Moyens de paiement.
 *
 * L'audit relève (§4.3) qu'aucun moyen de paiement local n'était proposé alors
 * que Mobile Money est le plus utilisé au Cameroun. Les emplacements sont donc
 * créés dès maintenant : ils affichent « Bientôt disponible » plutôt que de
 * rester absents, pour que l'intégration ne demande qu'un remplacement de
 * contenu.
 */
const moyensPaiement = [
  {
    icon: Smartphone,
    title: "Mobile Money",
    description: "Orange Money et MTN Mobile Money.",
    status: "Coordonnées communiquées sur demande",
  },
  {
    icon: Building2,
    title: "Virement bancaire",
    description: "Pour les dons importants et les partenariats.",
    status: "Coordonnées communiquées sur demande",
  },
  {
    icon: CreditCard,
    title: "Carte bancaire",
    description: "Utile pour les donateurs de la diaspora.",
    status: "Bientôt disponible",
  },
] as const;

/**
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15.
 *
 * La section « À quoi sert votre don » liste des programmes lus en base et
 * pointe vers leurs pages. Figée au build, elle proposerait un lien vers un
 * programme dépublié — c'est-à-dire un lien mort, ce que l'invariant nº 2
 * interdit. Voir l'en-tête de `src/server/queries/programmes.query.ts`.
 */
export const dynamic = "force-dynamic";

export default async function DonPage() {
  const programmes = await getProgrammesPublies();
  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Faire un don", href: "/don" },
        ])}
      />
      <JsonLd
        data={faqJsonLd(
          faqDon.map(({ question, answer }) => ({ question, answer })),
        )}
      />

      <PageHero
        eyebrow="Faire un don"
        title="Votre don finance une action, pas une intention"
        subtitle="Scolarité d'un enfant, campagne de dépistage, colis alimentaire, kit de démarrage d'activité : chaque contribution est affectée à un programme identifié."
        image="/images/hero/hero-don.jpeg"
        imageAlt="Distribution de matériel lors d'une action d'ADEBES"
        tone="green"
      />

      <section className="py-14 lg:py-20">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* --- Montant + WhatsApp --- */}
            <div className="lg:col-span-6">
              <DonationAmounts />
            </div>

            {/* --- À quoi sert un don --- */}
            <div className="lg:col-span-6">
              <Reveal>
                <SectionHeading
                  badge="Transparence"
                  title="À quoi sert votre don"
                  subtitle="Nous n'affichons pas de pourcentages de répartition tant qu'ils ne sont pas issus d'un rapport validé. Voici en revanche ce que finance concrètement chaque programme."
                />
              </Reveal>

              <Reveal delay={0.08}>
                <ul className="mt-6 flex flex-col gap-2.5">
                  {programmes.slice(0, 5).map((programme) => {
                    return (
                      <li key={programme.slug}>
                        <Link
                          href={`/programmes/${programme.slug}`}
                          className="flex items-start gap-3 rounded-xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted"
                        >
                          <span className="mt-0.5 grid size-8 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            {/* La base stocke un NOM d'icône, pas un composant. */}
                            <ContentIcon
                              name={programme.icon}
                              className="size-4"
                            />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-sm font-semibold text-foreground">
                              {programme.title}
                            </span>
                            <span className="block text-xs leading-relaxed text-muted-foreground">
                              {/*
                                Repli sur le résumé : un programme dont la
                                liste de besoins serait vide afficherait sinon
                                une ligne blanche sous son titre.
                              */}
                              {programme.besoins[0] ?? programme.summary}
                            </span>
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              </Reveal>

              <Reveal delay={0.12}>
                <Button asChild variant="outline" className="mt-5">
                  <Link href="/impact">Voir notre page transparence</Link>
                </Button>
              </Reveal>
            </div>
          </div>
        </Container>
      </section>

      {/* --- Autres moyens --- */}
      <section className="bg-card py-14 lg:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              badge="Moyens de paiement"
              title="D'autres façons de donner"
              subtitle="WhatsApp reste le canal le plus rapide. Ces moyens complémentaires sont disponibles ou en cours de mise en place."
              align="center"
            />
          </Reveal>

          <ul className="mt-10 grid gap-4 md:grid-cols-3">
            {moyensPaiement.map((moyen, index) => {
              const Icon = moyen.icon;
              return (
                <Reveal as="li" key={moyen.title} delay={index * 0.06}>
                  <div className="flex h-full flex-col gap-3 rounded-2xl border border-border bg-background p-5">
                    <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
                      <Icon className="size-5" aria-hidden="true" />
                    </span>
                    <h3 className="font-heading text-base font-semibold text-foreground">
                      {moyen.title}
                    </h3>
                    <p className="text-sm leading-relaxed text-muted-foreground">
                      {moyen.description}
                    </p>
                    <span className="mt-auto w-fit rounded-full border border-border px-3 py-1 text-xs text-muted-foreground">
                      {moyen.status}
                    </span>
                  </div>
                </Reveal>
              );
            })}
          </ul>

          <Reveal delay={0.15}>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Pour obtenir les coordonnées de paiement, écrivez à{" "}
              <a
                href={`mailto:${contact.email}`}
                className="inline-flex items-center gap-1.5 font-medium text-primary underline-offset-4 hover:underline"
              >
                <Mail className="size-3.5" aria-hidden="true" />
                {contact.email}
              </a>
            </p>
          </Reveal>
        </Container>
      </section>

      {/* --- FAQ dons --- */}
      <section className="py-14 lg:py-20">
        <Container size="narrow">
          <Reveal>
            <SectionHeading
              badge="Questions fréquentes"
              title="Vos questions sur les dons"
              align="center"
            />
          </Reveal>

          <Reveal delay={0.1}>
            <FAQAccordion items={faqDon} className="mt-8" />
          </Reveal>

          <Reveal delay={0.15}>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Vous préférez donner de votre temps ?{" "}
              <Link
                href="/benevolat"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Devenez bénévole
              </Link>
              .
            </p>
          </Reveal>
        </Container>
      </section>
    </>
  );
}
