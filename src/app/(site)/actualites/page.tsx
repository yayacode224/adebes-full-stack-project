import type { Metadata } from "next";

import { SectionsRenderer } from "@/components/blocks/section-renderer";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { getPagePublique } from "@/server/queries/pages.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /actualites — bascule sur la base (§8B), puis sur les sections (§9.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA GRILLE EST DÉSORMAIS UNE SECTION, ET ELLE PERD SON FILTRE
 * ---------------------------------------------------------------------------
 * `getArticlesPublies()` est appelé par `<NewsGridRenderer>`, pas ici — la
 * DONNÉE reste fidèle (mêmes articles, même tri du plus récent au plus
 * ancien, mêmes dates programmées respectées). Ce qui disparaît, c'est
 * l'INTERACTION : `<ActualitesFilter>` filtrait par catégorie, et le bloc
 * générique `news-grid` du §10 du Rapport 1 n'a pas d'équivalent — aucun bloc
 * de la v1 ne porte de `showFilters` pour les actualités, contrairement à
 * `gallery-preview`. Écart consigné, pas corrigé en douce : voir le rapport
 * final du Lot 9 pour l'arbitrage complet.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15
 * ---------------------------------------------------------------------------
 * Sans lui, cette page serait PRÉRENDUE AU BUILD avec les données de ce
 * moment-là : un article publié depuis le dashboard n'apparaîtrait qu'au
 * prochain déploiement.
 *
 * Ici, une raison SUPPLÉMENTAIRE par rapport au Lot 8A, et elle est
 * structurelle : la visibilité d'un article dépend de `now()`. Un article
 * programmé pour demain doit apparaître demain, sans que personne ne
 * redéploie. Une page figée au build ne peut pas tenir cette promesse — et le
 * Lot 15 devra donc lui donner un `cacheLife` court, pas `'days'` comme aux
 * programmes. C'est noté dans `articles.query.ts`.
 */
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Actualités",
  description:
    "Les dernières actions d'ADEBES sur le terrain : campagnes de santé, rentrée scolaire, opérations environnementales et vie de l'association.",
  alternates: { canonical: "/actualites" },
  openGraph: {
    title: "Actualités · ADEBES",
    description: "Les nouvelles du terrain, programme par programme.",
    url: "/actualites",
  },
};

export default async function ActualitesPage() {
  const page = await getPagePublique("/actualites");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Actualités", href: "/actualites" },
        ])}
      />

      <PageHero
        eyebrow="Actualités"
        title="Les nouvelles du terrain"
        subtitle="Chaque action menée fait l'objet d'un article dédié, partageable et consultable à tout moment."
        image="/images/hero/hero-actualites.jpeg"
        imageAlt="Équipe d'ADEBES lors d'une action récente"
        tone="blue"
      />

      <SectionsRenderer
        sections={page?.sections ?? []}
        page={page ?? { slug: "actualites", route: "/actualites", title: "Actualités" }}
      />

      <CTABanner
        title="Vous voulez être tenu au courant ?"
        subtitle="Écrivez-nous sur WhatsApp : nous partageons nos prochaines actions et les besoins du moment."
      />
    </>
  );
}
