import { ArrowRight, Check, Heart, Target, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { FaWhatsapp } from "react-icons/fa6";

import { ProgrammeCard } from "@/components/cards/programme-card";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { CmsImage } from "@/components/media/cms-image";
import { MediaImage } from "@/components/media/media-image";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Breadcrumbs } from "@/components/ui-ext/breadcrumbs";
import { ContentIcon } from "@/components/ui-ext/content-icon";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { Button } from "@/components/ui/button";
import { urlMedia } from "@/lib/media-url";
import { coverParDefaut, galerieParDefaut } from "@/lib/programme-visuels";
import { whatsappLink, whatsappMessages } from "@/lib/site-config";
import { resoudreMedias } from "@/server/queries/media.query";
import {
  getProgrammePublie,
  getProgrammesPublies,
} from "@/server/queries/programmes.query";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /programmes/[slug] — bascule sur la base (§8A.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les cinq points du §8A.5 :
 *
 *   * `params` est une PROMESSE — `const { slug } = await params` (Next.js 16,
 *     règle nº 3 du §15) ;
 *   * `generateMetadata` réutilise la même requête, mémoïsée par `cache()` ;
 *   * un slug inconnu appelle `notFound()` ;
 *   * l'icône passe par `getIcon(programme.icon)` — la base stocke une chaîne ;
 *   * `generateStaticParams` : voir ci-dessous.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE `generateStaticParams`, ET C'EST LIÉ À `force-dynamic`
 * ---------------------------------------------------------------------------
 * Le §8A.5 demande « `generateStaticParams` interroge la base pour les slugs
 * publiés ». Les deux ne peuvent pas coexister : une page rendue à la demande
 * n'a pas de liste de chemins à prégénérer, et Next ignorerait la fonction.
 *
 * C'est le même arbitrage que sur `/programmes` : sans rendu dynamique, les
 * huit pages seraient figées au build et une correction faite dans le
 * dashboard n'apparaîtrait qu'au prochain déploiement. Le §8A l'interdit
 * explicitement (« le fait apparaître sur /programmes après publication »).
 *
 * Le Lot 15 rétablit les deux ensemble : `'use cache'` remplace
 * `force-dynamic`, et `generateStaticParams` redevient utile puisque
 * `getSlugsProgrammesPublies()` — déjà écrit et déjà employé par `sitemap.ts` —
 * l'alimentera. Voir l'en-tête de `programmes.query.ts`.
 */
export const dynamic = "force-dynamic";

export async function generateMetadata(
  props: PageProps<"/programmes/[slug]">,
): Promise<Metadata> {
  const { slug } = await props.params;
  const programme = await getProgrammePublie(slug);

  if (!programme) return { title: "Programme introuvable" };

  const medias = await resoudreMedias([programme.coverMediaId]);
  const couverture = programme.coverMediaId
    ? medias.get(programme.coverMediaId)
    : undefined;

  return {
    title: programme.title,
    description: programme.summary,
    alternates: { canonical: `/programmes/${programme.slug}` },
    openGraph: {
      title: `${programme.title} · ADEBES`,
      description: programme.summary,
      url: `/programmes/${programme.slug}`,
      // Même priorité qu'au rendu : la médiathèque d'abord, le visuel livré
      // avec le dépôt à défaut. `urlMedia` renvoie une URL absolue, ce
      // qu'Open Graph exige ; `metadataBase` complète le chemin relatif du
      // repli.
      images: [
        { url: urlMedia(couverture) ?? coverParDefaut(programme.slug) },
      ],
    },
  };
}

export default async function ProgrammePage(
  props: PageProps<"/programmes/[slug]">,
) {
  const { slug } = await props.params;

  const programme = await getProgrammePublie(slug);
  if (!programme) notFound();

  const tous = await getProgrammesPublies();
  const autres = tous.filter((p) => p.slug !== programme.slug).slice(0, 3);

  /*
    Une seule résolution de médias pour toute la page : la couverture, les
    photos de la galerie et les couvertures des trois cartes du bas. Les
    demander section par section produirait quatre requêtes là où une suffit.
  */
  const medias = await resoudreMedias([
    programme.coverMediaId,
    ...programme.galleryMediaIds,
    ...autres.map((p) => p.coverMediaId),
  ]);

  const couverture = programme.coverMediaId
    ? (medias.get(programme.coverMediaId) ?? null)
    : null;

  /*
    Les photos « Sur le terrain ».

    Un identifiant qui ne correspond plus à rien est ÉCARTÉ, pas rendu en cadre
    vide : c'est l'invariant nº 2 (« aucun lien mort »). Si la galerie est vide
    — le cas de tous les programmes tant qu'aucune photo n'a été choisie dans
    la médiathèque — on retombe sur les trois fichiers livrés dans `/public`,
    qui eux-mêmes se replient sur un placeholder s'ils manquent.
  */
  const galerie = programme.galleryMediaIds
    .map((identifiant) => medias.get(identifiant))
    .filter((media) => media !== undefined);

  const crumbs = [
    { label: "Accueil", href: "/" },
    { label: "Programmes", href: "/programmes" },
    { label: programme.shortTitle, href: `/programmes/${programme.slug}` },
  ];

  return (
    <>
      <JsonLd data={breadcrumbJsonLd(crumbs)} />

      <PageHero
        title={programme.title}
        subtitle={programme.summary}
        image={coverParDefaut(programme.slug)}
        imageAlt={`Programme ${programme.title} — action d'ADEBES sur le terrain`}
        tone={programme.tone}
        breadcrumb={<Breadcrumbs items={crumbs} tone="inverse" />}
        /*
          `<PageHero>` résout son image dans `/public`. Quand une couverture a
          été choisie dans la médiathèque, elle prime : elle est passée en
          `imageNode` plutôt que par `image`, le composant n'ayant pas à
          connaître Supabase.
        */
        imageNode={
          couverture ? (
            <CmsImage
              asset={couverture}
              fill
              priority
              tone={programme.tone}
              sizes="100vw"
            />
          ) : undefined
        }
      />

      <section className="py-14 lg:py-20">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* --- Colonne principale --- */}
            <div className="lg:col-span-7">
              <Reveal>
                <SectionHeading
                  as="h2"
                  title="Ce que nous faisons"
                  subtitle="Les actions concrètes menées dans le cadre de ce programme."
                />

                <ul className="mt-6 flex flex-col gap-3">
                  {programme.actions.map((action) => (
                    <li
                      key={action}
                      className="flex gap-3 rounded-xl border border-border bg-card p-4"
                    >
                      <span className="mt-0.5 grid size-6 shrink-0 place-items-center rounded-full bg-brand-green/15 text-brand-green-ink dark:text-brand-green">
                        <Check className="size-3.5" aria-hidden="true" />
                      </span>
                      <span className="text-[0.95rem] leading-relaxed text-foreground">
                        {action}
                      </span>
                    </li>
                  ))}
                </ul>
              </Reveal>

              <Reveal delay={0.08}>
                <h2 className="mt-12 font-heading text-xl font-bold text-foreground sm:text-2xl">
                  À qui ce programme s&apos;adresse
                </h2>
                <ul className="mt-5 flex flex-wrap gap-2">
                  {programme.publics.map((item) => (
                    <li
                      key={item}
                      className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-3.5 py-2 text-sm text-muted-foreground"
                    >
                      <Users
                        className="size-3.5 shrink-0 text-primary"
                        aria-hidden="true"
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </Reveal>

              {/* --- Galerie du programme --- */}
              <Reveal delay={0.12}>
                <h2 className="mt-12 font-heading text-xl font-bold text-foreground sm:text-2xl">
                  Sur le terrain
                </h2>
                <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {galerie.length > 0
                    ? galerie.map((media) => (
                        <li
                          key={media.id}
                          className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
                        >
                          <CmsImage
                            asset={media}
                            fill
                            tone={programme.tone}
                            compactPlaceholder
                            sizes="(min-width: 640px) 20vw, 45vw"
                          />
                        </li>
                      ))
                    : galerieParDefaut(programme.slug).map((src, index) => (
                        <li
                          key={src}
                          className="relative aspect-[4/3] overflow-hidden rounded-xl bg-muted"
                        >
                          <MediaImage
                            src={src}
                            alt={`${programme.title} — photo ${index + 1} d'une action menée par ADEBES`}
                            fill
                            tone={programme.tone}
                            compactPlaceholder
                            sizes="(min-width: 640px) 20vw, 45vw"
                          />
                        </li>
                      ))}
                </ul>
              </Reveal>
            </div>

            {/* --- Colonne d'action --- */}
            <aside className="lg:col-span-5">
              <Reveal delay={0.1}>
                <div className="sticky top-24 flex flex-col gap-4 rounded-2xl border border-border bg-card p-6">
                  <span className="grid size-11 place-items-center rounded-xl bg-primary/10 text-primary">
                    <ContentIcon name={programme.icon} className="size-5" />
                  </span>

                  <h2 className="font-heading text-lg font-bold text-foreground">
                    Comment soutenir ce programme
                  </h2>

                  <ul className="flex flex-col gap-2.5">
                    {programme.besoins.map((besoin) => (
                      <li
                        key={besoin}
                        className="flex gap-2.5 text-sm leading-relaxed text-muted-foreground"
                      >
                        <Target
                          className="mt-0.5 size-4 shrink-0 text-brand-green-ink dark:text-brand-green"
                          aria-hidden="true"
                        />
                        {besoin}
                      </li>
                    ))}
                  </ul>

                  <div className="mt-2 flex flex-col gap-2.5">
                    <Button asChild variant="donate">
                      <Link href="/don">
                        <Heart className="size-4" aria-hidden="true" />
                        Soutenir par un don
                      </Link>
                    </Button>

                    <Button asChild variant="outline">
                      <Link href="/benevolat">
                        <Users className="size-4" aria-hidden="true" />
                        Devenir bénévole
                      </Link>
                    </Button>

                    <Button asChild variant="whatsapp">
                      <a
                        href={whatsappLink(
                          whatsappMessages.programme(programme.title),
                        )}
                        target="_blank"
                        rel="noreferrer noopener"
                      >
                        <FaWhatsapp className="size-4" aria-hidden="true" />
                        Poser une question
                      </a>
                    </Button>
                  </div>
                </div>
              </Reveal>
            </aside>
          </div>
        </Container>
      </section>

      {/* --- Autres programmes --- */}
      {autres.length > 0 ? (
        <section className="border-t border-border bg-card py-14 lg:py-20">
          <Container size="wide">
            <Reveal>
              <SectionHeading
                title="Nos autres programmes"
                action={
                  <Button asChild variant="outline">
                    <Link href="/programmes">
                      Voir les 8 programmes
                      <ArrowRight className="size-4" aria-hidden="true" />
                    </Link>
                  </Button>
                }
              />
            </Reveal>

            <ul className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {autres.map((autre, index) => (
                <Reveal as="li" key={autre.slug} delay={index * 0.06}>
                  <ProgrammeCard
                    programme={autre}
                    cover={
                      autre.coverMediaId
                        ? medias.get(autre.coverMediaId)
                        : null
                    }
                  />
                </Reveal>
              ))}
            </ul>
          </Container>
        </section>
      ) : null}
    </>
  );
}
