import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { Reveal } from "@/components/ui-ext/reveal";
import { SectionHeading } from "@/components/ui-ext/section-heading";
import { cn } from "@/lib/utils";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'OSSATURE COMMUNE AUX SECTIONS DE PAGE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `<section>` + `<Container>` + `<SectionHeading>` + `<Reveal>`, dans l'ordre
 * et avec les espacements que les dix pages du site emploient déjà.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE COMPOSANT EXISTE
 * ---------------------------------------------------------------------------
 * Sans lui, quatorze `Renderer` auraient recopié les mêmes six lignes de JSX
 * — et, comme les dix pages actuelles le montrent, elles auraient fini par
 * diverger : `py-14 lg:py-20` ici, `py-16 lg:py-24` là, `size="wide"` d'un
 * côté et `size="default"` de l'autre, sans qu'aucune de ces différences ne
 * corresponde à une intention.
 *
 * Le registre de blocs promet une cohérence que le contenu ne peut pas donner
 * seul : deux sections du même type doivent se ressembler d'une page à
 * l'autre. C'est ici que cette promesse est tenue.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX RYTHMES VERTICAUX, ET UN SEUL EST UN CHOIX
 * ---------------------------------------------------------------------------
 * Le site en emploie deux : `py-16 lg:py-24` sur l'accueil, `py-14 lg:py-20`
 * sur les pages intérieures. L'accueil respire davantage parce qu'il est la
 * vitrine ; les pages intérieures sont plus denses parce qu'on y lit.
 *
 * L'écart est donc REPRIS tel quel (`espacement`), et non uniformisé : le
 * réduire aurait été une modification de design déguisée en refactorisation,
 * exactement ce que la recette du lot interdit — « les 10 pages migrées sont
 * visuellement identiques à leur version actuelle ».
 */

export type EnteteDeSection = {
  badge: string;
  title: string;
  subtitle: string;
  align?: "left" | "center";
};

/** Y a-t-il quelque chose à rendre dans l'en-tête ? */
export function enteteEstVide(entete: EnteteDeSection): boolean {
  return !entete.badge && !entete.title && !entete.subtitle;
}

export function BlockSection({
  id,
  entete,
  taille = "wide",
  espacement = "page",
  fond = "aucun",
  bordure = false,
  action,
  className,
  children,
}: {
  /** Ancre HTML, quand la section est la cible d'un lien. */
  id?: string;
  entete: EnteteDeSection;
  taille?: "narrow" | "default" | "wide";
  /** `accueil` = py-16/24, `page` = py-14/20. Voir l'avertissement ci-dessus. */
  espacement?: "accueil" | "page";
  fond?: "aucun" | "carte";
  bordure?: boolean;
  /** Lien secondaire aligné à droite de l'en-tête (« Voir tout »). */
  action?: ReactNode;
  className?: string;
  children?: ReactNode;
}) {
  const vide = enteteEstVide(entete);

  return (
    <section
      id={id}
      className={cn(
        espacement === "accueil" ? "py-16 lg:py-24" : "py-14 lg:py-20",
        fond === "carte" && "bg-card",
        bordure && "border-t border-border",
        className,
      )}
    >
      <Container size={taille}>
        {vide ? null : (
          <Reveal>
            <SectionHeading
              badge={entete.badge || undefined}
              title={entete.title}
              subtitle={entete.subtitle || undefined}
              align={entete.align ?? "left"}
              action={action}
            />
          </Reveal>
        )}

        {children}
      </Container>
    </section>
  );
}

/**
 * Le pied de section : une phrase, éventuellement suivie d'un lien.
 *
 * Cinq blocs le portent (`faq`, `documents-list`, `feature-list`,
 * `donation-options`, et le `rich-text` de `/don`), toujours sous la même
 * forme. Le composant existe pour la même raison que `<BlockSection>`.
 *
 * ⚠️  `min-h-11` SUR LE LIEN, ET CE N'EST PAS NÉGOCIABLE.
 *
 * C'est l'arbitrage des écarts nº 112 et suivants : la règle des 44 px du §12
 * ne connaît pas d'exception pour « un lien au sein d'une phrase ». Les trois
 * pages qui portent aujourd'hui ce motif l'appliquent déjà, chacune de leur
 * côté ; le bloc l'applique une fois pour toutes.
 *
 * Le prix visible et assumé : la hauteur de ligne augmente autour du lien.
 */
export function PiedDeSection({
  texte,
  libelleLien,
  href,
  aligne = "left",
  className,
}: {
  texte: string;
  libelleLien: string;
  href: string;
  aligne?: "left" | "center";
  className?: string;
}) {
  if (!texte && !libelleLien) return null;

  // Un libellé sans adresse ne produit PAS de lien : ce serait un lien mort,
  // c'est-à-dire l'invariant nº 2 pris en défaut par une saisie incomplète.
  const lienAffichable = Boolean(libelleLien && href);

  return (
    <Reveal delay={0.1}>
      <p
        className={cn(
          "mt-8 text-sm text-muted-foreground",
          aligne === "center" && "text-center",
          className,
        )}
      >
        {texte}
        {texte && lienAffichable ? " " : null}
        {lienAffichable ? (
          <>
            <LienDePied href={href} libelle={libelleLien} />.
          </>
        ) : null}
      </p>
    </Reveal>
  );
}

/**
 * Le lien d'un pied de section.
 *
 * `<a>` et non `<Link>` dès que l'adresse sort du site ou n'est pas une route
 * — `mailto:`, `tel:`, `https://`. `next/link` sur un `mailto:` produit un
 * avertissement en développement et n'apporte aucun préchargement.
 */
function LienDePied({ href, libelle }: { href: string; libelle: string }) {
  const interne = href.startsWith("/") || href.startsWith("#");

  const classes =
    "inline-flex min-h-11 items-center px-1 font-medium text-primary underline-offset-4 hover:underline";

  if (interne) {
    return (
      <a href={href} className={classes}>
        {libelle}
      </a>
    );
  }

  return (
    <a
      href={href}
      className={classes}
      // `noreferrer noopener` sur tout lien externe : règle du §13.
      {...(href.startsWith("http")
        ? { target: "_blank", rel: "noreferrer noopener" }
        : {})}
    >
      {libelle}
    </a>
  );
}
