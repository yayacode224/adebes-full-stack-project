import type { Metadata } from "next";
import Link from "next/link";

import { SectionsRenderer } from "@/components/blocks/section-renderer";
import { DonationAmounts } from "@/components/don/donation-amounts";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { ContentIcon } from "@/components/ui-ext/content-icon";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { getPagePublique } from "@/server/queries/pages.query";
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

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /don — bascule sur les sections (§9.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE SEULE DES TROIS SECTIONS DU CORPS PASSE PAR LE CMS
 * ---------------------------------------------------------------------------
 * « À quoi sert votre don » liste des PROGRAMMES lus en direct et pointe vers
 * leurs pages : c'est une donnée DÉRIVÉE de la collection des programmes, pas
 * du contenu éditorial propre à cette page. La figer dans un bloc `feature-list`
 * aurait dupliqué des titres et des résumés déjà source unique ailleurs — la
 * même faute que fabriquer un chiffre, étendue à une liste. Elle reste donc du
 * CODE, comme le sélecteur de montants (`<DonationAmounts>`) juste au-dessus.
 *
 * « D'autres façons de donner » EST du contenu éditorial statique (trois
 * moyens de paiement, une mention d'état chacun) : c'est la section migrée,
 * dans le bloc `donation-options`, avec `showAmounts: false` — le sélecteur de
 * montants reste affiché par le code, juste au-dessus ; l'activer aussi dans
 * le bloc l'aurait dupliqué.
 *
 * La FAQ des dons est la seconde section migrée (`faq`, `source: "don"`) — son
 * balisage `FAQPage` est désormais émis par `<FaqRenderer>`, plus par cette
 * page.
 */
export const dynamic = "force-dynamic";

export default async function DonPage() {
  const [programmes, page] = await Promise.all([
    getProgrammesPublies(),
    getPagePublique("/don"),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Faire un don", href: "/don" },
        ])}
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

      <SectionsRenderer
        sections={page?.sections ?? []}
        page={page ?? { slug: "don", route: "/don", title: "Faire un don" }}
      />
    </>
  );
}
