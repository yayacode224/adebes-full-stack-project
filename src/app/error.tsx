"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";
import Link from "next/link";
import { useEffect } from "react";

import { Container } from "@/components/layout/container";
import { Button } from "@/components/ui/button";
import { contact } from "@/lib/site-config";

/**
 * Erreur applicative.
 *
 * Le message reste volontairement générique : le détail technique de l'erreur
 * n'apprend rien d'utile au visiteur et peut exposer des informations
 * internes. En revanche, les canaux de contact directs sont rappelés — un
 * donateur ne doit jamais se retrouver sans moyen de joindre l'association.
 */
export default function GlobalRouteError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[ADEBES] Erreur de rendu :", error);
  }, [error]);

  return (
    <Container
      size="narrow"
      className="flex flex-col items-center py-24 text-center lg:py-32"
    >
      <span className="grid size-16 place-items-center rounded-2xl bg-destructive/10 text-destructive">
        <TriangleAlert className="size-7" aria-hidden="true" />
      </span>

      <h1 className="mt-6 font-heading text-3xl font-bold leading-tight text-foreground sm:text-4xl">
        Une erreur est survenue
      </h1>

      <p className="mt-4 max-w-md text-[0.95rem] leading-relaxed text-muted-foreground">
        La page n&apos;a pas pu s&apos;afficher correctement. Réessayez dans un
        instant — si le problème persiste, écrivez-nous directement.
      </p>

      {error.digest ? (
        <p className="mt-3 font-mono text-xs text-muted-foreground">
          Référence : {error.digest}
        </p>
      ) : null}

      <div className="mt-8 flex flex-col gap-3 sm:flex-row">
        <Button size="lg" onClick={reset}>
          <RotateCcw className="size-4" aria-hidden="true" />
          Réessayer
        </Button>

        <Button asChild variant="outline" size="lg">
          <Link href="/">Retour à l&apos;accueil</Link>
        </Button>
      </div>

      <p className="mt-8 text-sm text-muted-foreground">
        Besoin d&apos;une réponse rapide ?{" "}
        <a
          href={`mailto:${contact.email}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {contact.email}
        </a>{" "}
        ·{" "}
        <a
          href={`tel:${contact.phoneE164}`}
          className="font-medium text-primary underline-offset-4 hover:underline"
        >
          {contact.phoneDisplay}
        </a>
      </p>
    </Container>
  );
}
