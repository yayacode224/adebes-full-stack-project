import { Clock, Mail, MapPin, Phone } from "lucide-react";
import Link from "next/link";

import { Logo } from "@/components/brand/logo";
import {
  conversionNav,
  legalNav,
  mainNav,
} from "@/lib/navigation";
import { contact, siteConfig } from "@/lib/site-config";

import { Container } from "./container";
import { SocialLinks } from "./social-links";

/**
 * Pied de page.
 *
 * Fond bleu nuit dans les deux thèmes : c'est la teinte du logo, et cela donne
 * au bas de page un ancrage stable quel que soit le mode d'affichage. Le logo y
 * est donc systématiquement rendu en variante claire (section 6).
 */
export function SiteFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="mt-auto bg-[#0b1b2b] text-white/80">
      <Container size="wide" className="py-12 lg:py-16">
        <div className="grid gap-10 lg:grid-cols-12 lg:gap-8">
          {/* Identité + mission */}
          <div className="lg:col-span-4">
            <Link
              href="/"
              className="inline-block rounded-md"
              aria-label="ADEBES — retour à l'accueil"
            >
              {/*
                Seul emplacement assez grand pour le verrouillage complet : en
                dessous de ~80 px, la raison sociale et la signature ne sont
                plus lisibles. 80 px sur mobile (le logo mesure alors 262 px de
                large, il tient dans la gouttière dès 375 px), 96 px au-delà.
                Hors écran au chargement, d'où le lazy par défaut.
              */}
              <Logo variant="white" withBaseline className="h-20 sm:h-24" />
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
              {siteConfig.description}
            </p>

            <SocialLinks tone="dark" className="mt-6" />
          </div>

          {/* Navigation */}
          <nav className="lg:col-span-3" aria-label="Liens rapides">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-white">
              Le site
            </h2>
            <ul className="mt-4 flex flex-col gap-1">
              {mainNav.slice(1).map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-md text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Agir */}
          <nav className="lg:col-span-2" aria-label="Agir avec ADEBES">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-white">
              Agir
            </h2>
            <ul className="mt-4 flex flex-col gap-1">
              {conversionNav.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="inline-flex min-h-11 items-center rounded-md text-sm text-white/70 transition-colors hover:text-white"
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          {/* Coordonnées */}
          <div className="lg:col-span-3">
            <h2 className="font-heading text-sm font-semibold uppercase tracking-wide text-white">
              Nous joindre
            </h2>
            <ul className="mt-4 flex flex-col gap-3 text-sm text-white/70">
              <li className="flex items-start gap-2.5">
                <MapPin
                  className="mt-0.5 size-4 shrink-0 text-brand-green"
                  aria-hidden="true"
                />
                <span>
                  {contact.city}, {contact.country}
                </span>
              </li>
              <li className="flex items-start gap-2.5">
                <Phone
                  className="mt-0.5 size-4 shrink-0 text-brand-green"
                  aria-hidden="true"
                />
                <a
                  href={`tel:${contact.phoneE164}`}
                  className="rounded-md transition-colors hover:text-white"
                >
                  {contact.phoneDisplay}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Mail
                  className="mt-0.5 size-4 shrink-0 text-brand-green"
                  aria-hidden="true"
                />
                <a
                  href={`mailto:${contact.email}`}
                  className="break-all rounded-md transition-colors hover:text-white"
                >
                  {contact.email}
                </a>
              </li>
              <li className="flex items-start gap-2.5">
                <Clock
                  className="mt-0.5 size-4 shrink-0 text-brand-green"
                  aria-hidden="true"
                />
                <span>{contact.openingHours}</span>
              </li>
            </ul>
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/15 pt-6 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-white/55">
            © {year} {siteConfig.name} — {siteConfig.legalName}. Tous droits
            réservés.
          </p>

          <ul className="flex flex-wrap items-center gap-x-5 gap-y-1">
            {legalNav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="inline-flex min-h-11 items-center rounded-md text-xs text-white/60 transition-colors hover:text-white sm:min-h-0"
                >
                  {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </Container>
    </footer>
  );
}
