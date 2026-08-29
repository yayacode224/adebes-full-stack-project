import type { ReactNode } from "react";

import { Container } from "@/components/layout/container";
import { MediaImage } from "@/components/media/media-image";
import type { MediaTone } from "@/components/media/media-placeholder";
import { cn } from "@/lib/utils";

/**
 * Hero des pages intérieures.
 *
 * Le header est en superposition : le padding supérieur lui réserve la place.
 * Un scrim opaque est systématiquement posé entre la photo et le texte —
 * c'est la seule façon de garantir un contraste AA sur une image dont on ne
 * maîtrise pas la luminosité (section 10 du cahier des charges).
 *
 * Aucun `Reveal` ici : le contenu du hero doit être lisible au premier rendu.
 */
export function PageHero({
  title,
  subtitle,
  image,
  imageAlt,
  tone = "navy",
  breadcrumb,
  actions,
  eyebrow,
  imageClassName,
  imageNode,
}: {
  title: string;
  subtitle?: string;
  /** Chemin du visuel dans /public. */
  image: string;
  imageAlt: string;
  /**
   * Visuel de remplacement, rendu à la place de `image`.
   *
   * Ajouté au Lot 8A : quand une couverture a été choisie dans la médiathèque,
   * elle vient de Supabase Storage et se rend avec `<CmsImage>`, pas avec
   * `<MediaImage>`. Passer le composant déjà construit évite à ce hero
   * d'apprendre ce qu'est un `MediaAsset` — il ne connaît que du JSX.
   *
   * `image` et `imageAlt` restent obligatoires : ils sont le repli tant
   * qu'aucune couverture n'a été choisie, ce qui est le cas de tous les
   * programmes aujourd'hui.
   */
  imageNode?: ReactNode;
  /**
   * Classes appliquées à la photo, pour les visuels dont le recadrage par
   * défaut ne convient pas (typiquement un portrait vertical, dont le cadrage
   * centré coupe la tête : voir `content/biographie.ts`). Facultatif — sans
   * cette prop le comportement des heros existants est inchangé.
   */
  imageClassName?: string;
  tone?: MediaTone;
  breadcrumb?: ReactNode;
  actions?: ReactNode;
  eyebrow?: string;
}) {
  return (
    <section className="relative isolate -mt-16 overflow-hidden bg-[#0b1b2b] lg:-mt-20">
      {imageNode ? (
        <div className={cn("absolute inset-0 opacity-90", imageClassName)}>
          {imageNode}
        </div>
      ) : (
        <MediaImage
          src={image}
          alt={imageAlt}
          fill
          tone={tone}
          priority
          sizes="100vw"
          className={cn("opacity-90", imageClassName)}
        />
      )}
      <div className="scrim absolute inset-0" aria-hidden="true" />

      <Container
        size="wide"
        className="relative flex min-h-[19rem] flex-col justify-end pb-10 pt-28 sm:min-h-[22rem] lg:min-h-[26rem] lg:pb-14 lg:pt-36"
      >
        {breadcrumb ? <div className="mb-5">{breadcrumb}</div> : null}

        {eyebrow ? (
          <p className="mb-3 text-xs font-semibold uppercase tracking-[0.14em] text-brand-green">
            {eyebrow}
          </p>
        ) : null}

        <h1
          className={cn(
            "max-w-3xl font-heading font-bold leading-[1.1] text-white",
            "text-3xl sm:text-4xl lg:text-5xl",
          )}
        >
          {title}
        </h1>

        {subtitle ? (
          <p className="mt-4 max-w-2xl text-[0.95rem] leading-relaxed text-white/85 sm:text-base">
            {subtitle}
          </p>
        ) : null}

        {actions ? (
          <div className="mt-7 flex flex-wrap gap-3">{actions}</div>
        ) : null}
      </Container>
    </section>
  );
}
