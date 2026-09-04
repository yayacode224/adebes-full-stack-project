import type { Metadata } from "next";

import { SectionsRenderer } from "@/components/blocks/section-renderer";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd, personJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { biographie } from "@/content/biographie";
import { resolveMedia } from "@/lib/media";
import { getPagePublique } from "@/server/queries/pages.query";

export const metadata: Metadata = {
  title: "Biographie",
  description: `${biographie.name} — ${biographie.resume}`,
  alternates: { canonical: "/biographie" },
  openGraph: {
    title: `Biographie de ${biographie.name} · ADEBES`,
    description: biographie.resume,
    url: "/biographie",
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /biographie — bascule sur les sections (§9.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * LES QUATRE SECTIONS DU CORPS SONT DÉSORMAIS DES SECTIONS DE PAGE
 * ---------------------------------------------------------------------------
 * Le portrait, les paragraphes de présentation, les quatre domaines
 * d'activité, les deux engagements et la liste « informations en attente »
 * viennent tous de `src/content/biographie.ts` — INCHANGÉ, ce fichier reste la
 * source du texte. Ce sont les COMPOSANTS de rendu qui changent : quatre
 * `<section>` écrites à la main deviennent quatre sections `image-text` /
 * `feature-list` / `feature-list` / `rich-text`, éditables depuis
 * `/dashboard/pages`.
 *
 * ⚠️  TROIS SIMPLIFICATIONS VISUELLES ASSUMÉES, DOCUMENTÉES DANS L'EN-TÊTE DE
 * `src/recette/lot9-migration-contenu.ts` (temporaire ; le choix définitif est
 * reproduit dans `supabase/seed.sql`) :
 *
 *   1. Les quatre domaines d'activité s'affichaient sur QUATRE colonnes à
 *      partir de `lg:` ; `feature-list` en propose trois au maximum ;
 *   2. La section « Informations en attente » perd son bandeau
 *      `<PlaceholderBadge>` et ses puces à icône : le texte est repris à
 *      l'identique, en paragraphes (`rich-text`, qui n'a pas de liste à
 *      puces) ;
 *   3. Le portrait (`portrait.png`) est désormais servi depuis la médiathèque,
 *      et non plus `/public` — migré avec le même texte alternatif.
 *
 * Cette page n'avait PAS `force-dynamic` avant ce lot : elle ne lisait rien de
 * la base. Elle le porte désormais, pour la raison commune à toutes les pages
 * migrées — une section publiée depuis le dashboard doit apparaître sans
 * attendre un déploiement.
 */
export const dynamic = "force-dynamic";

export default async function BiographiePage() {
  /**
   * Le portrait n'est déclaré dans les données structurées que s'il a
   * réellement été déposé : même règle que pour les rapports de la page
   * Impact — on ne référence jamais un fichier qui n'existe pas.
   */
  const portrait = resolveMedia(biographie.media.portrait);
  const page = await getPagePublique("/biographie");

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Biographie", href: "/biographie" },
        ])}
      />
      <JsonLd
        data={personJsonLd({
          name: biographie.name,
          jobTitle: biographie.role,
          description: biographie.resume,
          path: "/biographie",
          image: portrait.available ? portrait.src : undefined,
        })}
      />

      <PageHero
        eyebrow="Biographie"
        title={biographie.name}
        subtitle={biographie.resume}
        image={biographie.media.cover}
        imageAlt={biographie.media.coverAlt}
        imageClassName={biographie.media.coverPosition}
        tone="navy"
      />

      <SectionsRenderer
        sections={page?.sections ?? []}
        page={page ?? { slug: "biographie", route: "/biographie", title: biographie.name }}
      />

      <CTABanner
        title="Soutenir les actions d'ADEBES"
        subtitle="Un don, quelques heures de bénévolat ou un simple message : chaque geste prolonge l'action menée sur le terrain."
      />
    </>
  );
}
