import { Clock, MapPin, Users } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa6";

import { SectionsRenderer } from "@/components/blocks/section-renderer";
import { VolunteerForm } from "@/components/forms/volunteer-form";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { ContentIcon } from "@/components/ui-ext/content-icon";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { contact, whatsappLink, whatsappMessages } from "@/lib/site-config";
import { getPagePublique } from "@/server/queries/pages.query";
import {
  getLibellesBenevolat,
  getProgrammesPublies,
} from "@/server/queries/programmes.query";

export const metadata: Metadata = {
  title: "Devenir bénévole",
  description:
    "Rejoignez les bénévoles d'ADEBES à Douala, Yaoundé et dans les régions de l'intérieur. Candidature en ligne, huit domaines d'engagement possibles.",
  alternates: { canonical: "/benevolat" },
  openGraph: {
    title: "Devenir bénévole · ADEBES",
    description:
      "Huit domaines d'engagement, de quelques heures par mois à un engagement régulier.",
    url: "/benevolat",
  },
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /benevolat — bascule sur les sections (§9.5)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ⚠️  « Domaines d'engagement » RESTE DU CODE : la grille liste les
 * PROGRAMMES publiés en direct (icône, `benevolatLabel`, lien vers la fiche).
 * C'est une donnée dérivée d'une autre collection, pas du contenu éditorial
 * propre à cette page — la figer dans un bloc `feature-list` aurait dupliqué
 * des données déjà source unique ailleurs. Voir l'en-tête de
 * `src/recette/lot9-migration-contenu.ts` pour le raisonnement complet, déjà
 * appliqué à `/don` (« à quoi sert votre don ») pour la même raison.
 *
 * La FAQ, elle, EST migrée (`faq`, `source: "benevolat"`) : c'est du contenu
 * éditorial statique, et son balisage `FAQPage` est désormais émis par
 * `<FaqRenderer>`, plus par cette page.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `force-dynamic` — TRANSITOIRE, À RETIRER AU LOT 15.
 * ---------------------------------------------------------------------------
 * Les domaines d'engagement viennent des programmes PUBLIÉS. Figés au build,
 * ils proposeraient un domaine retiré du site — ou tairaient un domaine
 * nouvellement ouvert, dont les candidatures n'arriveraient jamais. Voir
 * l'en-tête de `src/server/queries/programmes.query.ts`.
 */
export const dynamic = "force-dynamic";

export default async function BenevolatPage() {
  /*
    Trois lectures indépendantes, la deuxième mémoïsée par `cache()` : elle ne
    déclenche pas de requête, elle dérive de la première.
  */
  const [programmes, domaines, page] = await Promise.all([
    getProgrammesPublies(),
    getLibellesBenevolat(),
    getPagePublique("/benevolat"),
  ]);

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Devenir bénévole", href: "/benevolat" },
        ])}
      />

      <PageHero
        eyebrow="Bénévolat"
        title="Donnez de votre temps, là où c'est utile"
        subtitle="Quelques heures par mois suffisent pour faire la différence. Choisissez le domaine qui vous correspond : nous vous recontactons pour en parler."
        image="/images/hero/hero-benevolat.jpeg"
        imageAlt="Bénévoles d'ADEBES réunis avant une action de terrain"
        tone="blue"
      />

      {/* --- Domaines d'engagement --- */}
      <section className="py-14 lg:py-20">
        <Container size="wide">
          <Reveal>
            <SectionHeading
              badge="Où s'engager"
              title="Huit domaines, une même façon de faire"
              subtitle="Chaque domaine correspond à un programme. Ouvrez sa fiche pour voir les actions menées avant de vous décider."
            />
          </Reveal>

          <ul className="mt-8 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {programmes.map((programme, index) => {
              return (
                <Reveal
                  as="li"
                  key={programme.slug}
                  delay={(index % 4) * 0.05}
                >
                  <Link
                    href={`/programmes/${programme.slug}`}
                    className="flex h-full flex-col gap-2.5 rounded-2xl border border-border bg-card p-4 transition-colors hover:border-primary/40 hover:bg-muted"
                  >
                    <span className="grid size-9 place-items-center rounded-lg bg-primary/10 text-primary">
                      {/* La base stocke un NOM d'icône, pas un composant. */}
                      <ContentIcon name={programme.icon} className="size-4" />
                    </span>
                    <span className="text-sm font-semibold leading-snug text-foreground">
                      {programme.benevolatLabel}
                    </span>
                  </Link>
                </Reveal>
              );
            })}
          </ul>
        </Container>
      </section>

      {/* --- Formulaire --- */}
      <section className="border-t border-border bg-card py-14 lg:py-20">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            <div className="lg:col-span-7">
              <Reveal>
                <SectionHeading
                  as="h2"
                  badge="Candidature"
                  title="Rejoindre l'équipe"
                  subtitle="Le formulaire prend deux minutes. Les champs marqués d'un astérisque sont obligatoires."
                />
              </Reveal>

              <Reveal delay={0.08}>
                <div className="mt-8">
                  {/*
                    Les domaines viennent de la BASE (§8A.2). Le formulaire est
                    un Client Component : il ne peut pas les lire lui-même, ils
                    lui sont passés en props depuis ce Server Component.
                  */}
                  <VolunteerForm domains={domaines} />
                </div>
              </Reveal>
            </div>

            <aside className="lg:col-span-5">
              <Reveal delay={0.1}>
                <div className="flex flex-col gap-5 rounded-2xl border border-border bg-background p-6">
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    Comment ça se passe
                  </h2>

                  <ol className="flex flex-col gap-4">
                    {[
                      {
                        title: "Vous envoyez votre candidature",
                        text: "Via le formulaire, ou directement sur WhatsApp.",
                      },
                      {
                        title: "Nous vous rappelons",
                        text: "Un premier échange pour comprendre vos attentes et vos disponibilités.",
                      },
                      {
                        title: "Vous rejoignez une action",
                        text: "Vous êtes intégré à l'équipe du programme qui vous correspond.",
                      },
                    ].map((etape, index) => (
                      <li key={etape.title} className="flex gap-3">
                        <span className="grid size-7 shrink-0 place-items-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                          {index + 1}
                        </span>
                        <span>
                          <span className="block text-sm font-semibold text-foreground">
                            {etape.title}
                          </span>
                          <span className="block text-sm leading-relaxed text-muted-foreground">
                            {etape.text}
                          </span>
                        </span>
                      </li>
                    ))}
                  </ol>

                  <ul className="flex flex-col gap-2.5 border-t border-border pt-5 text-sm text-muted-foreground">
                    <li className="flex items-center gap-2.5">
                      <MapPin
                        className="size-4 shrink-0 text-brand-green-ink dark:text-brand-green"
                        aria-hidden="true"
                      />
                      Douala, Yaoundé et régions de l&apos;intérieur
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Clock
                        className="size-4 shrink-0 text-brand-green-ink dark:text-brand-green"
                        aria-hidden="true"
                      />
                      {contact.openingHours}
                    </li>
                    <li className="flex items-center gap-2.5">
                      <Users
                        className="size-4 shrink-0 text-brand-green-ink dark:text-brand-green"
                        aria-hidden="true"
                      />
                      Aucune compétence particulière exigée
                    </li>
                  </ul>

                  <Button asChild variant="whatsapp" className="w-full">
                    <a
                      href={whatsappLink(whatsappMessages.benevolat)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <FaWhatsapp className="size-4" aria-hidden="true" />
                      Écrire sur WhatsApp
                    </a>
                  </Button>
                </div>
              </Reveal>
            </aside>
          </div>
        </Container>
      </section>

      <SectionsRenderer
        sections={page?.sections ?? []}
        page={page ?? { slug: "benevolat", route: "/benevolat", title: "Devenir bénévole" }}
      />
    </>
  );
}
