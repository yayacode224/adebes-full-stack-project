import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";

/**
 * Gabarit des pages légales.
 *
 * Pas de hero photographique ici : ces pages sont consultées pour être lues,
 * pas pour être séduisantes. Une colonne étroite (~65 caractères par ligne) et
 * une hiérarchie de titres claire suffisent.
 */
export function LegalPage({
  title,
  updatedAt,
  children,
}: {
  title: string;
  /** Date ISO de dernière mise à jour du document. */
  updatedAt: string;
  children: ReactNode;
}) {
  return (
    <article className="py-14 lg:py-20">
      <Container size="narrow">
        <h1 className="font-heading text-3xl font-bold leading-tight text-foreground sm:text-4xl">
          {title}
        </h1>

        <p className="mt-3 text-sm text-muted-foreground">
          Dernière mise à jour :{" "}
          <time dateTime={updatedAt}>
            {new Intl.DateTimeFormat("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            }).format(new Date(updatedAt))}
          </time>
        </p>

        <div className="mt-10 flex flex-col gap-8 text-[0.95rem] leading-relaxed text-muted-foreground [&_a]:font-medium [&_a]:text-primary [&_a]:underline-offset-4 hover:[&_a]:underline [&_h2]:font-heading [&_h2]:text-xl [&_h2]:font-bold [&_h2]:text-foreground [&_h3]:font-heading [&_h3]:text-base [&_h3]:font-semibold [&_h3]:text-foreground [&_li]:ml-4 [&_li]:list-disc [&_p+p]:mt-3 [&_ul]:mt-3 [&_ul]:flex [&_ul]:flex-col [&_ul]:gap-1.5">
          {children}
        </div>
      </Container>
    </article>
  );
}

/** Section d'une page légale : un titre et son contenu. */
export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section>
      <h2>{title}</h2>
      <div className="mt-3">{children}</div>
    </section>
  );
}
