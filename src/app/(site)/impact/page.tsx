import type { Metadata } from "next";

import { SectionsRenderer } from "@/components/blocks/section-renderer";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { getPagePublique } from "@/server/queries/pages.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /impact — bascule sur la base (§8G/§8I), puis sur les sections (§9.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * LES QUATRE SECTIONS DU CORPS SONT DÉSORMAIS DES SECTIONS DE PAGE
 * ---------------------------------------------------------------------------
 * `getChiffresAffiches()` et `getRapportsAnnuels()` sont appelés par
 * `<StatsGridRenderer>` et `<DocumentsListRenderer>`, pas ici — y compris
 * leurs règles déjà établies (chiffre non consolidé affiché avec « — »,
 * rapport sans PDF affiché avec sa pastille, section entière masquée si la
 * collection est vide). « Nos engagements » et « Nos zones d'intervention »
 * étaient du texte figé dans ce fichier ; ils sont désormais deux sections
 * `feature-list`, éditables depuis `/dashboard/pages`.
 *
 * C'est la migration la PLUS FIDÈLE des dix pages : les quatre sections du
 * seed (§1 du Rapport 1) correspondent exactement aux quatre blocs déjà
 * prévus, sans correction de type ni perte de fonctionnalité.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15
 * ---------------------------------------------------------------------------
 * Cette page était entièrement STATIQUE avant le Lot 8G. Sans cette
 * directive, `/impact` serait prérendue au build : corriger un chiffre ou
 * ajouter un rapport depuis le dashboard laisserait l'ancienne page en ligne
 * jusqu'au prochain déploiement — sur la page qui promet la transparence.
 */
export const dynamic = "force-dynamic";

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

export default async function ImpactPage() {
  const page = await getPagePublique("/impact");

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

      <SectionsRenderer
        sections={page?.sections ?? []}
        page={page ?? { slug: "impact", route: "/impact", title: "Impact et transparence" }}
      />

      <CTABanner
        title="La transparence appelle la confiance"
        subtitle="Et la confiance permet d'agir. Soutenez un programme, ou venez voir par vous-même."
      />
    </>
  );
}
