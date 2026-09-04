import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { NewsCard } from "@/components/cards/news-card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui-ext/reveal";
import type { NewsGridContent } from "@/core/cms/blocks/definitions/news-grid.block";
import { cn } from "@/lib/utils";
import {
  getArticlesPublies,
  getCategoriesParId,
} from "@/server/queries/articles.query";
import { resoudreMedias } from "@/server/queries/media.query";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Dernières actualités ».
 *
 * ⚠️  Aucun tri ni filtre de date ici : `getArticlesPublies()` rend déjà la
 * liste triée du plus récent au plus ancien ET filtrée sur les dates échues
 * (Lot 8B). Un article programmé pour le mois prochain n'apparaît donc pas,
 * sans qu'aucune condition ne soit répétée. Le refaire ici aurait dupliqué une
 * règle métier dans une couche de présentation.
 */
export async function NewsGridRenderer({
  content,
}: ProprietesDeRendu<NewsGridContent>) {
  const tous = await getArticlesPublies();
  const articles = content.limit === null ? tous : tous.slice(0, content.limit);

  if (articles.length === 0) return null;

  const [categories, couvertures] = await Promise.all([
    getCategoriesParId(),
    resoudreMedias(articles.map((article) => article.coverMediaId)),
  ]);

  return (
    <BlockSection
      entete={content}
      espacement="page"
      action={
        content.ctaLabel && content.ctaHref ? (
          <Button asChild variant="outline">
            <Link href={content.ctaHref}>
              {content.ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : undefined
      }
    >
      <ul
        className={cn(
          "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
          enteteEstVide(content) ? undefined : "mt-10",
        )}
      >
        {articles.map((article, index) => (
          <Reveal as="li" key={article.slug} delay={index * 0.06}>
            <NewsCard
              article={article}
              categorie={
                article.categoryId
                  ? categories.get(article.categoryId)?.label
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
    </BlockSection>
  );
}
