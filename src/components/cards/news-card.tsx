import { CalendarDays, Clock } from "lucide-react";
import Link from "next/link";

import { CmsImage } from "@/components/media/cms-image";
import { MediaImage } from "@/components/media/media-image";
import { PlaceholderBadge } from "@/components/ui-ext/placeholder-badge";
import { Badge } from "@/components/ui/badge";
import type { Article } from "@/core/cms/entities/article";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { actualiteCover } from "@/lib/actualite-visuels";
import { formatDate } from "@/lib/dates";
import { cn } from "@/lib/utils";

/**
 * Carte d'actualité.
 *
 * ---------------------------------------------------------------------------
 * CE QUI A CHANGÉ AU LOT 8B
 * ---------------------------------------------------------------------------
 * L'`Article` reçu est celui du DOMAINE (`core/cms/entities/article`), plus le
 * type `Actualite` de `src/content/`. Quatre conséquences visibles ici :
 *
 *   * la catégorie est un IDENTIFIANT en base : la carte reçoit son libellé
 *     déjà résolu, parce qu'aller le chercher produirait une requête par carte ;
 *   * le visuel vient d'un identifiant de média, plus d'une convention de
 *     nommage de fichier — avec repli sur `/public` tant que la médiathèque est
 *     vide (`actualite-visuels.ts`) ;
 *   * `publishedAt` est NULLABLE. Une carte ne s'affiche que pour un article
 *     publié, donc la date existe en pratique ; le cas contraire n'affiche pas
 *     de date plutôt qu'une date inventée (invariant nº 1) ;
 *   * `readingMinutes` est nullable pour la même raison. Sans valeur, la
 *     mention disparaît — jamais « 0 min de lecture ».
 */
export function NewsCard({
  article,
  categorie,
  cover,
  className,
  priority = false,
}: {
  article: Article;
  /** Libellé de la catégorie, déjà résolu par la page. */
  categorie?: string | null;
  /**
   * La couverture déjà résolue par la page.
   *
   * Résolue en amont et non ici : une carte qui va chercher son média
   * produirait une requête par carte, soit trois sur l'accueil.
   */
  cover?: MediaAsset | null;
  className?: string;
  priority?: boolean;
}) {
  const alt = `Illustration de l'article : ${article.title}`;

  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative aspect-[3/2] overflow-hidden bg-muted">
        {cover ? (
          <CmsImage
            asset={cover}
            alt={alt}
            fill
            tone="blue"
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 90vw"
            className="transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <MediaImage
            src={actualiteCover(article.slug)}
            alt={alt}
            fill
            tone="blue"
            priority={priority}
            sizes="(min-width: 1024px) 33vw, (min-width: 640px) 45vw, 90vw"
            className="transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}

        {categorie ? (
          <Badge
            variant="secondary"
            className="absolute left-3 top-3 bg-background/90 backdrop-blur-sm"
          >
            {categorie}
          </Badge>
        ) : null}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
          {article.publishedAt ? (
            <span className="inline-flex items-center gap-1.5">
              <CalendarDays className="size-3.5" aria-hidden="true" />
              {/* Date lisible + date machine, pour les moteurs et l'accessibilité. */}
              <time dateTime={article.publishedAt}>
                {formatDate(article.publishedAt)}
              </time>
            </span>
          ) : null}

          {article.readingMinutes ? (
            <span className="inline-flex items-center gap-1.5">
              <Clock className="size-3.5" aria-hidden="true" />
              {article.readingMinutes} min de lecture
            </span>
          ) : null}
        </div>

        <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
          <Link
            href={`/actualites/${article.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {article.title}
          </Link>
        </h3>

        <p className="line-clamp-3 text-sm leading-relaxed text-muted-foreground">
          {article.excerpt}
        </p>

        {article.isPlaceholder ? (
          <PlaceholderBadge className="relative z-10 mt-auto w-fit" />
        ) : null}
      </div>
    </article>
  );
}
