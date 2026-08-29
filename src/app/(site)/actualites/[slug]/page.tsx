import { CalendarDays, Clock } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { ShareButtons } from "@/components/actualites/share-buttons";
import { NewsCard } from "@/components/cards/news-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { CmsImage } from "@/components/media/cms-image";
import {
  JsonLd,
  articleJsonLd,
  breadcrumbJsonLd,
} from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui-ext/breadcrumbs";
import { CTABanner } from "@/components/ui-ext/cta-banner";
import { PlaceholderBadge } from "@/components/ui-ext/placeholder-badge";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { Badge } from "@/components/ui/badge";
import { actualiteCover } from "@/lib/actualite-visuels";
import { formatDate } from "@/lib/dates";
import { urlMedia } from "@/lib/media-url";
import { siteUrl } from "@/lib/site-config";
import {
  getArticlePublie,
  getArticlesPublies,
  getCategoriesParId,
} from "@/server/queries/articles.query";
import { resoudreMedias } from "@/server/queries/media.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /actualites/[slug] — bascule sur la base (§8B)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 *   * `params` est une PROMESSE — `const { slug } = await params` (Next.js 16,
 *     règle nº 3 du §15) ;
 *   * `generateMetadata` réutilise la même requête, mémoïsée par `cache()` ;
 *   * un slug inconnu — ou un article en brouillon, ou programmé — appelle
 *     `notFound()`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE `generateStaticParams`, ET C'EST LIÉ À `force-dynamic`
 * ---------------------------------------------------------------------------
 * Les deux ne peuvent pas coexister : une page rendue à la demande n'a pas de
 * liste de chemins à prégénérer. Même arbitrage qu'au Lot 8A, avec une raison
 * de plus, propre aux articles : la visibilité dépend de `now()`, et une liste
 * de chemins figée au build ne contiendrait pas l'article programmé pour la
 * semaine prochaine.
 *
 * Le Lot 15 rétablira les deux : `getSlugsArticlesPublies()` est déjà écrit et
 * déjà employé par `sitemap.ts`.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/actualites/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const article = await getArticlePublie(slug);

  if (!article) return { title: "Article introuvable" };

  const medias = await resoudreMedias([article.coverMediaId]);
  const couverture = article.coverMediaId
    ? medias.get(article.coverMediaId)
    : undefined;

  return {
    title: article.title,
    description: article.excerpt,
    alternates: { canonical: `/actualites/${article.slug}` },
    openGraph: {
      type: "article",
      title: article.title,
      description: article.excerpt,
      url: `/actualites/${article.slug}`,
      // `?? undefined` : Open Graph n'accepte pas `null`, et une date de
      // publication absente sur un article publié n'existe pas en pratique —
      // `setArticleStatus` la fixe. La branche existe pour le type, pas pour
      // le cas.
      publishedTime: article.publishedAt ?? undefined,
      // Même priorité qu'au rendu : la médiathèque d'abord, le visuel livré
      // avec le dépôt à défaut. `urlMedia` renvoie une URL absolue, ce
      // qu'Open Graph exige ; `metadataBase` complète le chemin relatif du
      // repli.
      images: [{ url: urlMedia(couverture) ?? actualiteCover(article.slug) }],
    },
  };
}

export default async function ArticlePage(
  props: PageProps<"/actualites/[slug]">,
) {
  const { slug } = await props.params;
  const article = await getArticlePublie(slug);

  if (!article) notFound();

  /*
    Les trois lectures qui suivent sont mémoïsées par `cache()` : la liste a
    déjà été chargée si l'on vient de `/actualites`, et `generateMetadata` a
    déjà résolu la couverture. Aucune requête n'est faite deux fois dans un
    même rendu.
  */
  const [tous, categories] = await Promise.all([
    getArticlesPublies(),
    getCategoriesParId(),
  ]);

  const aLire = tous.filter((item) => item.slug !== article.slug).slice(0, 3);

  const medias = await resoudreMedias([
    article.coverMediaId,
    ...aLire.map((item) => item.coverMediaId),
  ]);

  const couverture = article.coverMediaId
    ? medias.get(article.coverMediaId)
    : undefined;

  const categorie = article.categoryId
    ? categories.get(article.categoryId)
    : undefined;

  const crumbs = [
    { label: "Accueil", href: "/" },
    { label: "Actualités", href: "/actualites" },
    { label: article.title, href: `/actualites/${article.slug}` },
  ];

  const alt = `Illustration de l'article : ${article.title}`;
  const imageJsonLd = urlMedia(couverture) ?? actualiteCover(article.slug);

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />
      {/*
        Le JSON-LD `Article` exige une date de publication. Un article publié en
        a toujours une (`setArticleStatus` la fixe) ; dans le cas impossible où
        elle manquerait, on N'ÉMET PAS le bloc plutôt que d'y écrire une date
        inventée — un balisage faux est pire qu'un balisage absent.
      */}
      {article.publishedAt ? (
        <JsonLd
          data={articleJsonLd({
            title: article.title,
            description: article.excerpt,
            slug: article.slug,
            datePublished: article.publishedAt,
            image: imageJsonLd,
          })}
        />
      ) : null}

      <PageHero
        title={article.title}
        image={actualiteCover(article.slug)}
        imageAlt={alt}
        tone="blue"
        breadcrumb={<Breadcrumbs items={crumbs} tone="inverse" />}
        // Écart nº 63 : une couverture venue de la médiathèque se rend avec
        // `<CmsImage>`. `image`/`imageAlt` restent le repli.
        imageNode={
          couverture ? (
            <CmsImage asset={couverture} alt={alt} fill sizes="100vw" priority />
          ) : undefined
        }
      />

      <article className="py-12 lg:py-16">
        <Container size="narrow">
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-border pb-6">
            {categorie ? <Badge variant="secondary">{categorie.label}</Badge> : null}

            {article.publishedAt ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <CalendarDays className="size-4" aria-hidden="true" />
                <time dateTime={article.publishedAt}>
                  {formatDate(article.publishedAt)}
                </time>
              </span>
            ) : null}

            {/* Sans estimation, la mention disparaît — jamais « 0 min ». */}
            {article.readingMinutes ? (
              <span className="inline-flex items-center gap-1.5 text-sm text-muted-foreground">
                <Clock className="size-4" aria-hidden="true" />
                {article.readingMinutes} min de lecture
              </span>
            ) : null}
          </div>

          {article.isPlaceholder ? (
            <PlaceholderBadge className="mt-6">
              Cet article est un exemple de mise en page — à remplacer par un
              contenu réel
            </PlaceholderBadge>
          ) : null}

          <div className="mt-8 flex flex-col gap-5 text-[1.02rem] leading-[1.75] text-foreground">
            <p className="text-lg font-medium leading-relaxed text-muted-foreground">
              {article.excerpt}
            </p>

            {article.body.map((paragraph, index) => (
              <p key={index}>{paragraph}</p>
            ))}
          </div>

          <div className="mt-10 border-t border-border pt-6">
            <ShareButtons
              title={article.title}
              url={`${siteUrl}/actualites/${article.slug}`}
            />
          </div>
        </Container>
      </article>

      {aLire.length > 0 ? (
        <section className="border-t border-border bg-card py-14 lg:py-20">
          <Container size="wide">
            <Reveal>
              <SectionHeading title="À lire également" />
            </Reveal>

            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {aLire.map((item, index) => (
                <Reveal as="li" key={item.slug} delay={index * 0.06}>
                  <NewsCard
                    article={item}
                    categorie={
                      item.categoryId
                        ? categories.get(item.categoryId)?.label
                        : undefined
                    }
                    cover={
                      item.coverMediaId ? medias.get(item.coverMediaId) : null
                    }
                  />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}

      <CTABanner />
    </>
  );
}
