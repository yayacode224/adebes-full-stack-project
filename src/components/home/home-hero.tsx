import { ArrowRight, Clock, Heart, MapPin } from "lucide-react";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { MediaImage } from "@/components/media/media-image";
import { Button } from "@/components/ui/button";
import { contact, siteConfig } from "@/lib/site-config";

/**
 * Hero de la page d'accueil.
 *
 * Rendu entièrement côté serveur, sans animation d'entrée : c'est le contenu
 * critique au-dessus de la ligne de flottaison. Il doit être lisible dès le
 * premier rendu, y compris sans JavaScript (section 9 du cahier des charges).
 *
 * La photo est chargée en `priority` — c'est le LCP de la page.
 */
export function HomeHero() {
  return (
    <section className="relative isolate -mt-16 flex min-h-[38rem] items-end overflow-hidden bg-[#0b1b2b] lg:-mt-20 lg:min-h-[88svh]">
      <MediaImage
        src="/images/hero/hero-home.jpeg"
        alt="Équipe et bénévoles d'ADEBES auprès d'une communauté camerounaise"
        fill
        tone="navy"
        priority
        sizes="100vw"
        placeholderLabel="Photo d'accueil — plan large et humain, 1920×1080 minimum"
        /*
         * Cadrage vertical de la photo.
         *
         * `hero-home.jpeg` est un portrait vertical (1086 × 1448) posé dans une
         * bande large : sur desktop, `object-cover` n'en garde qu'une tranche
         * horizontale d'environ 30 à 40 % de la hauteur de l'image. Centrée par
         * défaut, cette tranche tombait sur le torse — le portique « ADEBES
         * GROUP » comme la tête étaient purement et simplement recadrés hors
         * champ.
         *
         * L'enseigne occupe la verticale 1 % → 18 % de l'image et la tête
         * 20 % → 31 % : ancrer la tranche à 5 % les conserve toutes les deux,
         * jusque sur les fenêtres larges et basses (1920 × 800) où la tranche
         * se réduit à 27 %. Anchor à 0 (`object-top`) y couperait le menton.
         *
         * Sans effet sur mobile : la photo y est plus haute que large par
         * rapport au conteneur, c'est donc la largeur qui est rognée et la
         * hauteur est déjà affichée en entier — la composante verticale est
         * inerte, la composante horizontale reste centrée à 50 %.
         *
         * `HomeHero` n'étant rendu que par la page d'accueil, ce cadrage ne
         * concerne qu'elle ; les heros des pages intérieures passent par
         * `PageHero` et gardent le leur.
         */
        className="object-[50%_5%]"
      />
      <div className="scrim absolute inset-0" aria-hidden="true" />

      <Container size="wide" className="relative pb-14 pt-32 lg:pb-20 lg:pt-40">
        <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/25 bg-white/10 px-3.5 py-1.5 text-xs font-medium text-white/90 backdrop-blur-sm">
          <span
            aria-hidden="true"
            className="size-1.5 rounded-full bg-brand-green"
          />
          {siteConfig.motto}
        </p>

        <h1 className="max-w-4xl font-heading text-[2rem] font-bold leading-[1.08] text-white sm:text-5xl lg:text-6xl">
          {siteConfig.tagline}
        </h1>

        <p className="mt-5 max-w-2xl text-[0.98rem] leading-relaxed text-white/85 sm:text-lg">
          {siteConfig.description}
        </p>

        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="donate" size="lg">
            <Link href="/don">
              <Heart className="size-4" aria-hidden="true" />
              Faire un don
            </Link>
          </Button>

          <Button asChild variant="outline-inverse" size="lg">
            <Link href="/programmes">
              Découvrir nos programmes
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        </div>

        <ul className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-2 text-xs text-white/70 sm:text-sm">
          <li className="inline-flex items-center gap-2">
            <MapPin className="size-4 shrink-0" aria-hidden="true" />
            {contact.city}, {contact.country}
          </li>
          <li className="inline-flex items-center gap-2">
            <Clock className="size-4 shrink-0" aria-hidden="true" />
            {contact.openingHours}
          </li>
        </ul>
      </Container>
    </section>
  );
}
