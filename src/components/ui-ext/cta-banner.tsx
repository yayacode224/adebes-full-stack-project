import { Heart, Users } from "lucide-react";
import Link from "next/link";
import { FaWhatsapp } from "react-icons/fa6";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { whatsappLink, whatsappMessages } from "@/lib/site-config";
import { cn } from "@/lib/utils";

/**
 * Bandeau d'appel à l'action de fin de page.
 *
 * Les trois canaux de conversion sont proposés côte à côte — don, bénévolat,
 * WhatsApp — là où l'ancien site n'en offrait qu'un seul (audit §4.3).
 */
export function CTABanner({
  title = "Votre soutien change des vies",
  subtitle = "Un don, quelques heures de bénévolat, ou simplement un message : chaque geste fait avancer nos programmes.",
  className,
  whatsappMessage = whatsappMessages.contact,
}: {
  title?: string;
  subtitle?: string;
  className?: string;
  whatsappMessage?: string;
}) {
  return (
    <section className={cn("py-14 lg:py-20", className)}>
      <Container size="wide">
        <div className="relative isolate overflow-hidden rounded-3xl bg-[#0b1b2b] px-6 py-12 text-center sm:px-10 lg:px-16 lg:py-16">
          {/* Halos décoratifs reprenant les deux rubans du logo. */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -left-24 -top-24 size-72 rounded-full bg-brand-blue/25 blur-3xl"
          />
          <div
            aria-hidden="true"
            className="pointer-events-none absolute -bottom-28 -right-20 size-72 rounded-full bg-brand-green/20 blur-3xl"
          />

          <div className="relative mx-auto max-w-2xl">
            <h2 className="font-heading text-2xl font-bold leading-tight text-white sm:text-3xl lg:text-4xl">
              {title}
            </h2>
            <p className="mt-4 text-[0.95rem] leading-relaxed text-white/80 sm:text-base">
              {subtitle}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:justify-center">
              <Button asChild variant="donate" size="lg">
                <Link href="/don">
                  <Heart className="size-4" aria-hidden="true" />
                  Faire un don
                </Link>
              </Button>

              <Button asChild variant="outline-inverse" size="lg">
                <Link href="/benevolat">
                  <Users className="size-4" aria-hidden="true" />
                  Devenir bénévole
                </Link>
              </Button>

              <Button asChild variant="whatsapp" size="lg">
                <a
                  href={whatsappLink(whatsappMessage)}
                  target="_blank"
                  rel="noreferrer noopener"
                >
                  <FaWhatsapp className="size-4" aria-hidden="true" />
                  WhatsApp
                </a>
              </Button>
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}
