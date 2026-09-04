import { SectionsRenderer } from "@/components/blocks/section-renderer";
import { HomeHero } from "@/components/home/home-hero";
import { JsonLd, ngoJsonLd, websiteJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { getPagePublique } from "@/server/queries/pages.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  / (accueil) — bascule sur les sections (§9.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * LES SEPT SECTIONS DU CORPS SONT DÉSORMAIS DES SECTIONS DE PAGE
 * ---------------------------------------------------------------------------
 * Chiffres clés · Qui sommes-nous · Valeurs · Programmes · Témoignages ·
 * Actualités · FAQ — les sept lectures (`getChiffresAffiches()`,
 * `getValeursAffichees()`, `getProgrammesPublies()`, `getTemoignagesPublies()`,
 * `getArticlesPublies()`, `getFaqAccueil()`) et les coupes qui leur étaient
 * propres (6 programmes, 3 témoignages, 3 articles) sont désormais internes
 * aux `Renderer` de `stats-grid`, `image-text`, `values-grid`,
 * `programmes-grid`, `testimonials`, `news-grid` et `faq`. C'est la migration
 * la plus complète des dix pages : sept sections sur sept, sans carve-out de
 * code, sans correction de type par rapport au plan du seed (§1 du Rapport 1).
 *
 * Ce qui RESTE en code : `<HomeHero>` (non paramétrable, distinct de
 * `page-hero` du registre) et `<CTABanner>` par défaut, comme sur les neuf
 * autres pages. Le balisage `FAQPage` est désormais émis par `<FaqRenderer>`,
 * plus par cette page.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15
 * ---------------------------------------------------------------------------
 * Sans cette directive, l'accueil serait prérendu au build : renommer un
 * programme depuis le dashboard laisserait l'ancien titre sur la page la plus
 * visitée du site, jusqu'au prochain déploiement.
 */
export const dynamic = "force-dynamic";

export default async function HomePage() {
  const page = await getPagePublique("/");

  return (
    <>
      <JsonLd data={ngoJsonLd()} />
      <JsonLd data={websiteJsonLd()} />

      <HomeHero />

      <SectionsRenderer
        sections={page?.sections ?? []}
        page={page ?? { slug: "accueil", route: "/", title: "Accueil" }}
      />

      <CTABanner />
    </>
  );
}
