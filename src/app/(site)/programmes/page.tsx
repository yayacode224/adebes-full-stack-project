import type { Metadata } from "next";

import { SectionsRenderer } from "@/components/blocks/section-renderer";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { getPagePublique } from "@/server/queries/pages.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /programmes — bascule sur la base (§8A.5), puis sur les sections (§9.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA GRILLE EST DÉSORMAIS UNE SECTION — LE CODE NE L'APPELLE PLUS
 * ---------------------------------------------------------------------------
 * `getProgrammesPublies()` est appelé par `<ProgrammesGridRenderer>`, pas ici.
 * Le contenu de la section (limite, libellés) se règle depuis
 * `/dashboard/pages` ; il n'y a plus de `FieldDescriptor` ni de JSX propres à
 * cette page.
 *
 * ⚠️  L'état « aucun programme publié » (message « Nos programmes arrivent »)
 * disparaît avec la migration : `<ProgrammesGridRenderer>` ne rend rien dans ce
 * cas, comme tous les blocs de collection. Le cas est dormant — huit
 * programmes sont publiés — et consigné plutôt que corrigé en douce.
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
  const page = await getPagePublique("/programmes");

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

      <SectionsRenderer
        sections={page?.sections ?? []}
        page={page ?? { slug: "programmes", route: "/programmes", title: "Nos programmes" }}
      />

      <CTABanner
        title="Un programme vous parle plus que les autres ?"
        subtitle="Vous pouvez le soutenir directement, ou rejoindre l'équipe qui le porte sur le terrain."
      />
    </>
  );
}
