import { House, SearchX } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { mainNav } from "@/lib/navigation";

export const metadata: Metadata = {
  title: "Page introuvable",
  robots: { index: false, follow: true },
};

/**
 * 404 personnalisée.
 *
 * Une page d'erreur qui se contente d'annoncer l'échec fait perdre le
 * visiteur. Celle-ci propose immédiatement les destinations utiles — et
 * notamment les deux parcours de conversion.
 */
export default function NotFound() {
  return (
    <Container size="narrow" className="flex flex-col items-center py-24 text-center lg:py-32">
      <span className="grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary">
        <SearchX className="size-7" aria-hidden="true" />
      </span>

      <p className="mt-6 font-heading text-sm font-semibold uppercase tracking-[0.14em] text-muted-foreground">
        Erreur 404
      </p>

      <h1 className="mt-2 font-heading text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        Cette page n&apos;existe pas
      </h1>

      <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
        Le lien est peut-être obsolète, ou la page a été déplacée. Voici où
        aller depuis ici.
      </p>

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button asChild size="lg">
          <Link href="/">
            <House className="size-4" aria-hidden="true" />
            Retour à l&apos;accueil
          </Link>
        </Button>

        <Button asChild variant="donate" size="lg">
          <Link href="/don">Faire un don</Link>
        </Button>
      </div>

      <nav aria-label="Pages principales" className="mt-12 w-full border-t border-border pt-8">
        <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2">
          {mainNav.slice(1).map((item) => (
            <li key={item.href}>
              <Link
                href={item.href}
                className="inline-flex min-h-11 items-center rounded-md text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </Container>
  );
}
