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
import { texteReponse } from "@/core/cms/entities/faq-item";
import {
  getArticlesPublies,
  getCategoriesParId,
} from "@/server/queries/articles.query";
import { getFaqAccueil } from "@/server/queries/faq.query";
import { resoudreMedias } from "@/server/queries/media.query";
import { getProgrammesPublies } from "@/server/queries/programmes.query";
import { getChiffresAffiches } from "@/server/queries/stats.query";
import { getTemoignagesPublies } from "@/server/queries/testimonials.query";
import { getValeursAffichees } from "@/server/queries/values.query";

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
    Les valeurs viennent de la base au Lot 8E.

    Aucune coupe ici, contrairement aux témoignages : `getValeursAffichees()`
    rend les valeurs marquées comme visibles, dans l'ordre choisi au dashboard,
    et la grille `lg:grid-cols-4` en absorbe un nombre quelconque.

    ⚠️  C'est la SEULE lecture de cette page partagée avec une autre :
    « Qui sommes-nous » appelle exactement la même fonction et rend exactement
    la même grille. Toute modification de section doit être portée aux deux, et
    `values.actions.ts` invalide bien les deux étiquettes de page.
  */
  const valeurs = await getValeursAffichees();

  /*
    Les questions fréquentes viennent de la base au Lot 8F.

    `getFaqAccueil()` applique la règle qui était écrite ici avant ce lot —
    « toutes sauf le bénévolat, les quatre premières » — mais elle est
    désormais dans le domaine (`selectionAccueil`), parce que l'écran
    `/dashboard/faq` doit dire la même chose à qui réordonne la liste.

    ⚠️  La section entière disparaît s'il ne reste aucune question publiée hors
    bénévolat. Même règle que pour les actualités, les témoignages et les
    valeurs — et elle compte doublement ici : sans elle, la page émettrait un
    JSON-LD `FAQPage` VIDE, c'est-à-dire une déclaration fausse envoyée aux
    moteurs de recherche.
  */
  const faqAccueil = await getFaqAccueil();

  /*
    Les chiffres clés viennent de la base au Lot 8G.

    Aucune coupe ici, comme pour les valeurs : `getChiffresAffiches()` rend les
    chiffres marqués comme visibles, dans l'ordre choisi au dashboard, et la
    grille `lg:grid-cols-4` en absorbe un nombre quelconque.

    ⚠️  LES CHIFFRES NON FOURNIS SONT DANS CETTE LISTE, et ils doivent y rester.
    `beneficiaires` porte `value = null` : la carte affiche « — » et sa mention,
    exactement comme avant ce lot. Filtrer sur « chiffre renseigné » aurait été
    plus joli et malhonnête — la carte disparue, plus rien ne dirait que
    l'association suit cet indicateur sans pouvoir encore le chiffrer. C'est
    l'invariant nº 1 du projet.

    ⚠️  C'est la seconde lecture de cette page partagée avec une autre :
    `/impact` appelle exactement la même fonction et rend les mêmes cartes — en
    y ajoutant la précision de chacune, que l'accueil n'affiche pas.
  */
  const chiffres = await getChiffresAffiches();

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

      {/*
        ⚠️  `texteReponse` compose le paragraphe ET les puces.

        Le balisage doit contenir ce que le visiteur lit : c'est la consigne de
        Google sur `FAQPage`, et l'écart n'était pas théorique — « Comment faire
        un don à ADEBES ? » énumère ses quatre canaux en puces, dont aucun
        n'entrait dans la réponse déclarée. Voir l'entité `FaqItem`.

        Aucun balisage n'est émis si la liste est vide : un `FAQPage` sans
        `mainEntity` est une déclaration fausse.
      */}
      {faqAccueil.length > 0 ? (
        <JsonLd
          data={faqJsonLd(
            faqAccueil.map((item) => ({
              question: item.question,
              answer: texteReponse(item),
            })),
          )}
        />
      ) : null}

      <HomeHero />

      {/* --- Chiffres clés — présents une seule fois sur la page --- */}
      {/*
        ⚠️  SECTION CONDITIONNELLE depuis le Lot 8G, et l'ancre `#chiffres` est
        nouvelle (elle est la destination des liens « Voir sur le site » de
        `/dashboard/chiffres/[id]` ; sans elle, le lien mène en haut de page).

        La condition suit la règle établie depuis le Lot 8B : une section vide
        disparaît plutôt que d'annoncer un contenu absent. Elle ne se déclenche
        que si TOUS les chiffres sont masqués — un chiffre sans valeur, lui,
        reste affiché avec « — ».

        La clé de liste est l'IDENTIFIANT, pas la clé technique : c'est la leçon
        de l'écart nº 114. `key` est unique en base, donc correct aujourd'hui,
        mais `id` l'est par construction et ne dépend d'aucune contrainte qu'une
        migration pourrait relâcher.
      */}
      {chiffres.length > 0 ? (
        <section
          id="chiffres"
          className="border-b border-border bg-card py-12 lg:py-16"
        >
          <Container size="wide">
            <h2 className="sr-only">Nos chiffres clés</h2>
            <ul className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              {chiffres.map((stat, index) => (
                <Reveal as="li" key={stat.id} delay={index * 0.06}>
                  <StatCard stat={stat} className="h-full" />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

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

      {/*
        --- Valeurs ---

        La section entière disparaît s'il ne reste aucune valeur affichée. Même
        règle que pour les actualités, les témoignages et l'équipe : un titre
        « Ce qui guide chacune de nos actions » suivi du vide serait pire que
        son absence.

        Ce n'est PAS le cas aujourd'hui — les quatre valeurs du seed portent
        `is_visible = true` et un contenu réel — mais le cas est atteignable
        depuis `/dashboard/valeurs`, et l'écran le dit avant comme après.

        ⚠️  `id="valeurs"` : l'ancre visée par « Voir sur l'accueil » depuis la
        fiche du dashboard. Sans elle, le lien mènerait en haut de page et
        laisserait chercher la section.
      */}
      {valeurs.length > 0 ? (
        <section id="valeurs" className="bg-card py-16 lg:py-24">
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
                <Reveal as="li" key={valeur.id} delay={index * 0.06}>
                  <ValueCard valeur={valeur} className="h-full" />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

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

      {/*
        --- FAQ ---

        La section entière disparaît s'il ne reste aucune question publiée hors
        bénévolat. Même règle que pour les actualités, les témoignages et les
        valeurs : un titre « Vous vous posez ces questions » suivi du vide
        annoncerait un contenu manquant.

        ⚠️  `id="faq"` : l'ancre visée par « Voir sur le site » depuis la fiche
        du dashboard. Sans elle, le lien mènerait en haut de page et laisserait
        chercher la section.
      */}
      {faqAccueil.length > 0 ? (
        <section id="faq" className="bg-card py-16 lg:py-24">
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
                {/*
                  ⚠️  `inline-flex min-h-11` : ce lien est une CIBLE TACTILE.

                  Mesuré à 89 × 17 px par la recette de ce lot, très en dessous
                  des 44 px de la règle 4 du §12. C'est le même arbitrage qu'à
                  l'écart nº 112 (Lot 8E) : la règle ne connaît pas d'exception
                  pour un lien « au sein d'une phrase », et se donner une
                  dispense au moment où elle arrange le code qu'on vient
                  d'écrire, c'est cesser de mesurer.

                  Le lien reste dans le fil du texte ; seule la hauteur de
                  ligne augmente, ce qui est le prix visible et assumé d'une
                  cible atteignable au pouce.
                */}
                <Link
                  href="/contact"
                  className="inline-flex min-h-11 items-center px-1 font-medium text-primary underline-offset-4 hover:underline"
                >
                  Écrivez-nous
                </Link>
                .
              </p>
            </Reveal>
          </Container>
        </section>
      ) : null}

      <CTABanner />
    </>
  );
}
