import type { Metadata } from "next";

import { ActualitesFilter } from "@/components/actualites/actualites-filter";
import { NewsCard } from "@/components/cards/news-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import {
  getArticlesPublies,
  getCategoriesParId,
} from "@/server/queries/articles.query";
import { resoudreMedias } from "@/server/queries/media.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /actualites — bascule sur la base (§8B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * La page lit `src/server/queries/articles.query.ts` et n'importe plus
 * `src/content/actualites.ts`.
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
  const articles = await getArticlesPublies();
  const categories = await getCategoriesParId();
  const medias = await resoudreMedias(articles.map((article) => article.coverMediaId));

  /**
   * Seules les catégories réellement représentées sont proposées au filtre.
   *
   * Comportement conservé du site actuel, et il compte davantage maintenant que
   * les catégories sont gérables : un bouton « Environnement » qui ne renvoie
   * jamais aucun article ferait douter du filtre, pas du contenu.
   *
   * L'ordre est celui des catégories en base — celui que l'utilisateur règle
   * dans la modale du dashboard — et non celui d'apparition des articles.
   */
  const libelles = [...categories.values()].map((categorie) => categorie.label);
  const categoriesUtilisees = libelles.filter((label) =>
    articles.some(
      (article) =>
        article.categoryId && categories.get(article.categoryId)?.label === label,
    ),
  );

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

      <section className="py-14 lg:py-20">
        <Container size="wide">
          {articles.length > 0 ? (
            <ActualitesFilter
              categories={categoriesUtilisees}
              articles={articles.map((article, index) => {
                const categorie = article.categoryId
                  ? categories.get(article.categoryId)
                  : undefined;

                return {
                  id: article.slug,
                  category: categorie?.label ?? null,
                  node: (
                    <NewsCard
                      article={article}
                      categorie={categorie?.label}
                      cover={
                        article.coverMediaId
                          ? medias.get(article.coverMediaId)
                          : null
                      }
                      // Les trois premières cartes sont visibles d'emblée :
                      // leur image ne doit pas être différée.
                      priority={index < 3}
                    />
                  ),
                };
              })}
            />
          ) : (
            <p className="rounded-2xl border border-dashed border-border p-12 text-center text-sm text-muted-foreground">
              Aucune actualité publiée pour le moment. Revenez bientôt.
            </p>
          )}
        </Container>
      </section>

      <CTABanner
        title="Vous voulez être tenu au courant ?"
        subtitle="Écrivez-nous sur WhatsApp : nous partageons nos prochaines actions et les besoins du moment."
      />
    </>
  );
}
