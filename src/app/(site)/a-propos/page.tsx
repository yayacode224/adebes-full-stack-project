import type { Metadata } from "next";

import { SectionsRenderer } from "@/components/blocks/section-renderer";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { siteConfig } from "@/lib/site-config";
import { getPagePublique } from "@/server/queries/pages.query";

export const metadata: Metadata = {
  title: "Qui sommes-nous",
  description:
    "ADEBES, association camerounaise à but non lucratif : mission, valeurs, équipe et gouvernance. Une action de terrain menée avec les communautés de Douala, Yaoundé et des régions de l'intérieur.",
  alternates: { canonical: "/a-propos" },
  openGraph: {
    title: "Qui sommes-nous · ADEBES",
    description: "Mission, valeurs, équipe et gouvernance de l'association.",
    url: "/a-propos",
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /a-propos — bascule sur la base (§8D/§8E), puis sur les sections (§9.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * LES QUATRE SECTIONS DU CORPS SONT DÉSORMAIS DES SECTIONS DE PAGE
 * ---------------------------------------------------------------------------
 * `getMembresEquipePublies()` et `getValeursAffichees()` sont appelés par
 * `<TeamGridRenderer>` et `<ValuesGridRenderer>`, pas ici — y compris les
 * règles déjà établies (section masquée si la collection est vide).
 *
 * ⚠️  DEUX ÉCARTS PAR RAPPORT AU CODE D'ORIGINE, DOCUMENTÉS ICI :
 *
 *   1. **Mission** portait DEUX images côte à côte ; `image-text` n'en accepte
 *      qu'une. Seule `histoire-01.jpeg` est conservée (désormais dans la
 *      médiathèque), `histoire-02.jpeg` ne l'est pas ;
 *   2. **Le titre des Valeurs était CALCULÉ** depuis `valeurs.length`
 *      (`src/lib/nombres.ts`, « Quatre principes… »). Le champ `title` d'un
 *      bloc est un texte fixe : la section migrée porte le texte figé sur le
 *      compte actuel (4). Même écart, déjà documenté et accepté, que « les 8
 *      programmes » sur `/programmes` : un texte éditorial devient faux si la
 *      collection change, et se corrige depuis le dashboard.
 *
 * **Gouvernance**, en revanche, a changé de TYPE DE BLOC par rapport au plan du
 * seed (`rich-text` → `feature-list`) : son contenu réel — deux cartes icône +
 * titre + description — est la forme exacte de `feature-list`, et non du
 * texte libre. Voir l'en-tête de `src/recette/lot9-migration-contenu.ts`
 * (temporaire, supprimé en fin de lot ; le choix est reproduit dans
 * `supabase/seed.sql`). Le lien vers `/impact` de la carte « Redevabilité »
 * n'a pas d'équivalent dans `feature-list` (pas de lien par élément) et
 * devient donc du texte simple.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15
 * ---------------------------------------------------------------------------
 * La section « L'équipe » lit la base. Sans cette directive, la page serait
 * prérendue au build : publier une fiche depuis le dashboard ne changerait
 * rien tant qu'un déploiement n'aurait pas eu lieu.
 */
export const dynamic = "force-dynamic";

export default async function AProposPage() {
  const page = await getPagePublique("/a-propos");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Qui sommes-nous", href: "/a-propos" },
        ])}
      />

      <PageHero
        eyebrow="Qui sommes-nous"
        title="Une association née du terrain"
        subtitle={siteConfig.description}
        image="/images/hero/hero-a-propos.jpeg"
        imageAlt="Membres et bénévoles d'ADEBES au Cameroun"
        tone="navy"
      />

      <SectionsRenderer
        sections={page?.sections ?? []}
        page={page ?? { slug: "a-propos", route: "/a-propos", title: "Qui sommes-nous" }}
      />

      <CTABanner
        title="Vous partagez nos valeurs ?"
        subtitle="Il y a autant de façons d'aider que de programmes. Commencez par celle qui vous ressemble."
      />
    </>
  );
}
