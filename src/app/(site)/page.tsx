import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { NewsCard } from "@/components/cards/news-card";
import { ProgrammeCard } from "@/components/cards/programme-card";
import { StatCard } from "@/components/cards/stat-card";
import { TestimonialCard } from "@/components/cards/testimonial-card";
import { ValueCard } from "@/components/cards/value-card";
import { HomeHero } from "@/components/home/home-hero";
import { Container } from "@/components/layout/container";
import { MediaImage } from "@/components/media/media-image";
import {
  JsonLd,
  faqJsonLd,
  ngoJsonLd,
  websiteJsonLd,
} from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { FAQAccordion } from "@/components/ui-ext/faq-accordion";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { faq } from "@/content/faq";
import { homeStats } from "@/content/stats";
import { valeurs } from "@/content/valeurs";
import {
  getArticlesPublies,
  getCategoriesParId,
} from "@/server/queries/articles.query";
import { resoudreMedias } from "@/server/queries/media.query";
import { getProgrammesPublies } from "@/server/queries/programmes.query";
import { getTemoignagesPublies } from "@/server/queries/testimonials.query";

const faqAccueil = faq.filter((item) => item.topic !== "benevolat").slice(0, 4);

/**
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15.
 *
 * La section « Nos programmes » lit désormais la base. Sans cette directive,
 * l'accueil serait prérendu au build : renommer un programme depuis le
 * dashboard laisserait l'ancien titre sur la page la plus visitée du site,
 * jusqu'au prochain déploiement — et l'étiquette `cms:page:accueil` que les
 * Server Actions invalident déjà ne servirait à rien.
 *
 * Le raisonnement complet, et la marche à suivre au Lot 15, sont dans
 * l'en-tête de `src/server/queries/programmes.query.ts`.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const programmes = (await getProgrammesPublies()).slice(0, 6);

  /*
    Les trois derniers articles viennent de la base au Lot 8B.

    `getArticlesPublies()` rend déjà la liste triée du plus récent au plus
    ancien ET filtrée sur les dates échues : un article programmé n'apparaît pas
    sur l'accueil avant sa date, sans qu'aucune condition ne soit répétée ici.
  */
  const derniersArticles = (await getArticlesPublies()).slice(0, 3);
  const categoriesArticles = await getCategoriesParId();

  /*
    Les témoignages viennent de la base au Lot 8C.

    `getTemoignagesPublies()` rend la liste triée par POSITION — l'ordre choisi
    dans le dashboard — et filtrée sur les seuls témoignages en ligne. La
    coupe à trois est faite ici parce qu'elle appartient à CETTE page : la
    grille est en `md:grid-cols-3`, et un quatrième témoignage produirait une
    ligne solitaire. Le dashboard le dit à la personne qui réordonne.
  */
  const temoignages = (await getTemoignagesPublies()).slice(0, 3);

  /*
    Une seule résolution de médias pour les trois sections : `resoudreMedias`
    dédoublonne et mémoïse sur la clé, mais trois appels distincts feraient
    trois requêtes. Les couvertures des programmes, celles des articles et les
    portraits des témoignages vivent dans la même table.
  */
  const couvertures = await resoudreMedias([
    ...programmes.map((programme) => programme.coverMediaId),
    ...derniersArticles.map((article) => article.coverMediaId),
    ...temoignages.map((temoignage) => temoignage.photoMediaId),
  ]);

  return (
    <>
      <JsonLd data={ngoJsonLd()} />
      <JsonLd data={websiteJsonLd()} />
      <JsonLd
        data={faqJsonLd(
          faqAccueil.map(({ question, answer }) => ({ question, answer })),
        )}
      />

      <HomeHero />

      {/* --- Chiffres clés — présents une seule fois sur la page --- */}
      <section className="border-b border-border bg-card py-12 lg:py-16">
        <Container size="wide">
          <h2 className="sr-only">Nos chiffres clés</h2>
          <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            {homeStats.map((stat, index) => (
              <Reveal as="li" key={stat.key} delay={index * 0.06}>
                <StatCard stat={stat} className="h-full" />
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/* --- Qui sommes-nous --- */}
      <section className="py-16 lg:py-24">
        <Container size="wide">
          <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-16">
            <Reveal>
              <div className="relative aspect-[4/3] overflow-hidden rounded-3xl bg-muted">
                <MediaImage
                  src="/images/a-propos/histoire-01.png"
                  alt="Bénévoles d'ADEBES lors d'une action de terrain à Douala"
                  fill
                  tone="blue"
                  sizes="(min-width: 1024px) 45vw, 90vw"
                />
              </div>
            </Reveal>

            <Reveal delay={0.1}>
              <SectionHeading
                badge="Qui sommes-nous"
                title="Une association camerounaise au service des communautés"
                subtitle="ADEBES est une organisation à but non lucratif qui agit dans l'éducation, la santé, l'inclusion sociale et le développement communautaire."
              />

              <ul className="mt-6 flex flex-col gap-3">
                {[
                  "Présente à Douala, Yaoundé et dans les régions de l'intérieur",
                  "8 programmes complémentaires, du soutien scolaire à l'autonomisation des femmes",
                  "Une action de terrain menée avec les communautés, pas à leur place",
                ].map((point) => (
                  <li
                    key={point}
                    className="flex gap-3 text-[0.95rem] leading-relaxed text-muted-foreground"
                  >
                    <span
                      aria-hidden="true"
                      className="mt-2 size-1.5 shrink-0 rounded-full bg-brand-green"
                    />
                    {point}
                  </li>
                ))}
              </ul>

              <Button asChild variant="outline" className="mt-7">
                <Link href="/a-propos">
                  En savoir plus sur ADEBES
                  <ArrowRight className="size-4" aria-hidden="true" />
                </Link>
              </Button>
            </Reveal>
          </div>
        </Container>
      </section>

      {/* --- Valeurs --- */}
      <section className="bg-card py-16 lg:py-24">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              badge="Nos valeurs"
              title="Ce qui guide chacune de nos actions"
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

      {/* --- Programmes --- */}
      <section className="py-16 lg:py-24">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              badge="Nos programmes"
              title="Huit domaines d'intervention"
              subtitle="Chaque programme a sa page dédiée : objectifs, actions menées et façons concrètes de le soutenir."
              action={
                <Button asChild variant="outline">
                  <Link href="/programmes">
                    Voir les 8 programmes
                    <ArrowRight className="size-4" aria-hidden="true" />
                  </Link>
                </Button>
              }
            />
          </Reveal>

          <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {programmes.map((programme, index) => (
              <Reveal as="li" key={programme.slug} delay={index * 0.05}>
                <ProgrammeCard
                  programme={programme}
                  cover={
                    programme.coverMediaId
                      ? couvertures.get(programme.coverMediaId)
                      : null
                  }
                />
              </Reveal>
            ))}
          </ul>
        </Container>
      </section>

      {/*
        --- Témoignages ---

        La section entière disparaît s'il n'y a aucun témoignage en ligne. Un
        titre « Celles et ceux qui font vivre ADEBES » suivi du vide serait pire
        que son absence : il annoncerait un contenu manquant. Même règle que la
        section « Actualités » juste en dessous.
      */}
      {temoignages.length > 0 ? (
        <section className="bg-card py-16 lg:py-24">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                badge="Témoignages"
                title="Celles et ceux qui font vivre ADEBES"
                subtitle="Bénéficiaires, bénévoles et partenaires racontent ce que change une action de terrain."
                align="center"
              />
            </Reveal>

            <ul className="mt-10 grid gap-5 md:grid-cols-3">
              {temoignages.map((temoignage, index) => (
                <Reveal as="li" key={temoignage.id} delay={index * 0.06}>
                  <TestimonialCard
                    temoignage={temoignage}
                    photo={
                      temoignage.photoMediaId
                        ? couvertures.get(temoignage.photoMediaId)
                        : null
                    }
                    className="h-full"
                  />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* --- Actualités --- */}
      {derniersArticles.length > 0 ? (
        <section className="py-16 lg:py-24">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                badge="Actualités"
                title="Les nouvelles du terrain"
                subtitle="Les dernières actions menées et les prochaines échéances."
                action={
                  <Button asChild variant="outline">
                    <Link href="/actualites">
                      Toutes les actualités
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                }
              />
            </Reveal>

            <ul className="mt-10 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {derniersArticles.map((article, index) => (
                <Reveal as="li" key={article.slug} delay={index * 0.06}>
                  <NewsCard
                    article={article}
                    categorie={
                      article.categoryId
                        ? categoriesArticles.get(article.categoryId)?.label
                        : undefined
                    }
                    cover={
                      article.coverMediaId
                        ? couvertures.get(article.coverMediaId)
                        : null
                    }
                  />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      {/* --- FAQ --- */}
      <section className="bg-card py-16 lg:py-24">
        <Container size="narrow">
          <Reveal>
            <SectionHeading
              badge="Questions fréquentes"
              title="Vous vous posez ces questions"
              align="center"
            />
          </Reveal>

          <Reveal delay={0.1}>
            <FAQAccordion items={faqAccueil} className="mt-8" />
          </Reveal>

          <Reveal delay={0.15}>
            <p className="mt-8 text-center text-sm text-muted-foreground">
              Une autre question ?{" "}
              <Link
                href="/contact"
                className="font-medium text-primary underline-offset-4 hover:underline"
              >
                Écrivez-nous
              </Link>
              .
            </p>
          </Reveal>
        </Container>
      </section>

      <CTABanner />
    </>
  );
}
