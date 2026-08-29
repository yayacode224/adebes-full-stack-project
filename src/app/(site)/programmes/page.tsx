import type { Metadata } from "next";

import { ProgrammeCard } from "@/components/cards/programme-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { Reveal } from "@/components/ui-ext/reveal";
import { resoudreMedias } from "@/server/queries/media.query";
import { getProgrammesPublies } from "@/server/queries/programmes.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /programmes — bascule sur la base (§8A.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La page lit `src/server/queries/programmes.query.ts` et n'importe plus
 * `src/content/programmes.ts`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15
 * ---------------------------------------------------------------------------
 * Sans lui, cette page serait PRÉRENDUE AU BUILD avec les données de ce
 * moment-là : un programme publié depuis le dashboard n'apparaîtrait qu'au
 * prochain déploiement, et la première ligne de la recette du §8A serait
 * fausse.
 *
 * La réponse définitive est `'use cache'` + `cacheTag` (§11 du Rapport 1), qui
 * exige `cacheComponents: true` — explicitement repoussé au Lot 15 par le §0.4
 * du Rapport 2. Le raisonnement complet est dans l'en-tête de
 * `programmes.query.ts`, avec la liste exacte de ce qu'il y aura à faire.
 *
 * En attendant, une lecture à chaque requête vaut mieux qu'un contenu figé :
 * c'est un coût de performance, pas une information fausse.
 */
export const dynamic = "force-dynamic";

/*
  Les libellés sont laissés À L'IDENTIQUE — « les 8 programmes », « Huit
  programmes » — parce que la recette du §8A compare le rendu avant/après.

  ⚠️  Ils deviennent faux si quelqu'un ajoute un neuvième programme depuis le
  dashboard. Ce sont des textes éditoriaux, qui relèvent du constructeur de
  pages (Lot 9) et des réglages SEO (Lot 10) : les recalculer ici ferait varier
  une phrase française selon un nombre, ce qui donne « 1 programmes ». Point de
  vigilance consigné dans REPRISE-CONTEXTE.
*/
export const metadata: Metadata = {
  title: "Nos programmes",
  description:
    "Les 8 programmes d'ADEBES : développement communautaire, éducation, santé, accompagnement des familles, inclusion sociale, environnement, jeunesse et autonomisation des femmes.",
  alternates: { canonical: "/programmes" },
  openGraph: {
    title: "Nos programmes · ADEBES",
    description:
      "Huit domaines d'intervention au service des communautés camerounaises.",
    url: "/programmes",
  },
};

export default async function ProgrammesPage() {
  const programmes = await getProgrammesPublies();
  const medias = await resoudreMedias(
    programmes.map((programme) => programme.coverMediaId),
  );

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Programmes", href: "/programmes" },
        ])}
      />

      <PageHero
        eyebrow="Nos actions"
        title="Huit programmes, une même exigence"
        subtitle="Chaque programme répond à un besoin identifié avec les communautés. Ouvrez une fiche pour découvrir les actions menées et les façons concrètes de les soutenir."
        image="/images/hero/hero-programmes.jpeg"
        imageAlt="Bénévoles d'ADEBES au travail auprès d'une communauté"
        tone="blue"
      />

      <section className="py-16 lg:py-24">
        <Container size="wide">
          {programmes.length === 0 ? (
            /*
              Aucun programme publié. Une grille vide et muette laisserait
              croire à une page cassée — c'est l'invariant nº 1 transposé au
              site public : une absence se dit, elle ne se laisse pas deviner.
            */
            <div className="rounded-2xl border border-dashed border-border bg-card px-6 py-12 text-center">
              <h2 className="font-heading text-lg font-semibold text-foreground">
                Nos programmes arrivent
              </h2>
              <p className="mx-auto mt-2 max-w-prose text-sm leading-relaxed text-muted-foreground">
                Les pages de nos domaines d&apos;intervention sont en cours de
                préparation. Écrivez-nous : nous vous dirons ce que nous menons
                en ce moment sur le terrain.
              </p>
            </div>
          ) : (
            <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {programmes.map((programme, index) => (
                <Reveal as="li" key={programme.slug} delay={(index % 3) * 0.06}>
                  <ProgrammeCard
                    programme={programme}
                    cover={
                      programme.coverMediaId
                        ? medias.get(programme.coverMediaId)
                        : null
                    }
                    // Les trois premières cartes sont visibles d'emblée : leur
                    // image ne doit pas être différée.
                    priority={index < 3}
                  />
                </Reveal>
              ))}
            </ul>
          )}
        </Container>
      </section>

      <CTABanner
        title="Un programme vous parle plus que les autres ?"
        subtitle="Vous pouvez le soutenir directement, ou rejoindre l'équipe qui le porte sur le terrain."
      />
    </>
  );
}
