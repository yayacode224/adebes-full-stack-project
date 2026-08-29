import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Metadata } from "next";
import { FaWhatsapp } from "react-icons/fa6";

import { ContactForm } from "@/components/forms/contact-form";
import { Container } from "@/components/layout/container";
import { PageHero } from "@/components/layout/page-hero";
import { SocialLinks } from "@/components/layout/social-links";
import { JsonLd, breadcrumbJsonLd } from "@/components/seo/json-ld";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { contact, whatsappLink, whatsappMessages } from "@/lib/site-config";

export const metadata: Metadata = {
  title: "Contact",
  description:
    "Contactez ADEBES à Douala : formulaire, e-mail, téléphone et WhatsApp. Réponse du lundi au samedi, de 8h à 18h.",
  alternates: { canonical: "/contact" },
  openGraph: {
    title: "Contact · ADEBES",
    description: "Écrivez-nous — formulaire, e-mail ou WhatsApp.",
    url: "/contact",
  },
};

/**
 * Carte : l'audit relève (§4.9) l'absence de toute localisation. Google Maps
 * est intégré en `iframe` avec `loading="lazy"` — la carte n'est chargée que
 * si le visiteur fait défiler jusqu'à elle, ce qui évite d'imposer plusieurs
 * centaines de kilo-octets à un visiteur mobile qui ne la regardera pas.
 */
const mapSrc = `https://www.google.com/maps?q=${encodeURIComponent(
  `${contact.city}, ${contact.country}`,
)}&output=embed`;

export default function ContactPage() {
  const coordonnees = [
    {
      icon: MapPin,
      label: "Adresse",
      value: `${contact.city}, ${contact.country}`,
      href: null,
    },
    {
      icon: Phone,
      label: "Téléphone",
      value: contact.phoneDisplay,
      href: `tel:${contact.phoneE164}`,
    },
    {
      icon: Mail,
      label: "E-mail",
      value: contact.email,
      href: `mailto:${contact.email}`,
    },
    {
      icon: Clock,
      label: "Horaires",
      value: contact.openingHours,
      href: null,
    },
  ] as const;

  return (
    <>
      <JsonLd
        data={breadcrumbJsonLd([
          { label: "Accueil", href: "/" },
          { label: "Contact", href: "/contact" },
        ])}
      />

      <PageHero
        eyebrow="Contact"
        title="Parlons de ce que nous pouvons faire ensemble"
        subtitle="Une question, un partenariat, une demande d'information : écrivez-nous par le canal qui vous convient."
        image="/images/hero/hero-contact.jpeg"
        imageAlt="Équipe d'ADEBES à l'écoute lors d'une permanence"
        tone="navy"
      />

      <section className="py-14 lg:py-20">
        <Container size="wide">
          <div className="grid gap-10 lg:grid-cols-12 lg:gap-14">
            {/* --- Formulaire --- */}
            <div className="lg:col-span-7">
              <Reveal>
                <SectionHeading
                  as="h2"
                  title="Nous écrire"
                  subtitle="Nous répondons pendant les heures d'ouverture. Pour une réponse immédiate, privilégiez WhatsApp."
                />
              </Reveal>

              <Reveal delay={0.08}>
                <div className="mt-8">
                  <ContactForm />
                </div>
              </Reveal>
            </div>

            {/* --- Coordonnées --- */}
            <aside className="lg:col-span-5">
              <Reveal delay={0.1}>
                <div className="flex flex-col gap-5 rounded-2xl border border-border bg-card p-6">
                  <h2 className="font-heading text-lg font-bold text-foreground">
                    Coordonnées
                  </h2>

                  <ul className="flex flex-col gap-4">
                    {coordonnees.map((item) => {
                      const Icon = item.icon;
                      return (
                        <li key={item.label} className="flex gap-3">
                          <span className="mt-0.5 grid size-9 shrink-0 place-items-center rounded-lg bg-primary/10 text-primary">
                            <Icon className="size-4" aria-hidden="true" />
                          </span>
                          <span className="min-w-0">
                            <span className="block text-xs font-medium uppercase tracking-wide text-muted-foreground">
                              {item.label}
                            </span>
                            {item.href ? (
                              <a
                                href={item.href}
                                className="block break-words text-sm font-medium text-foreground underline-offset-4 hover:underline"
                              >
                                {item.value}
                              </a>
                            ) : (
                              <span className="block text-sm font-medium text-foreground">
                                {item.value}
                              </span>
                            )}
                          </span>
                        </li>
                      );
                    })}
                  </ul>

                  <Button asChild variant="whatsapp" className="w-full">
                    <a
                      href={whatsappLink(whatsappMessages.contact)}
                      target="_blank"
                      rel="noreferrer noopener"
                    >
                      <FaWhatsapp className="size-4" aria-hidden="true" />
                      Discuter sur WhatsApp
                    </a>
                  </Button>

                  <div className="border-t border-border pt-5">
                    <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                      Nous suivre
                    </p>
                    <SocialLinks className="mt-3" />
                  </div>
                </div>
              </Reveal>
            </aside>
          </div>
        </Container>
      </section>

      {/* --- Carte --- */}
      <section className="border-t border-border">
        <h2 className="sr-only">Nous localiser</h2>
        <div className="relative h-[22rem] w-full bg-muted lg:h-[26rem]">
          <iframe
            src={mapSrc}
            title={`Carte de localisation d'ADEBES à ${contact.city}, ${contact.country}`}
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            className="size-full border-0"
          />
        </div>
      </section>
    </>
  );
}
