import Image from "next/image";

import { resolveMedia } from "@/lib/media";
import { cn } from "@/lib/utils";

import {
  MediaPlaceholder,
  type MediaKind,
  type MediaTone,
} from "./media-placeholder";

type CommonProps = {
  /** Chemin définitif dans /public, selon la convention de nommage. */
  src: string;
  /**
   * Texte alternatif descriptif et spécifique (WCAG 1.1.1). Sert aussi de
   * libellé au placeholder tant que la photo réelle n'est pas fournie.
   */
  alt: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  tone?: MediaTone;
  kind?: MediaKind;
  /** Libellé du placeholder s'il doit différer du texte alternatif. */
  placeholderLabel?: string;
  compactPlaceholder?: boolean;
};

type Props = CommonProps &
  (
    | { fill: true; width?: never; height?: never }
    | { fill?: false; width: number; height: number }
  );

/**
 * `next/image` avec repli automatique sur un placeholder tant que le fichier
 * n'a pas été déposé dans /public (voir `resolveMedia`).
 *
 * Server Component : la vérification du système de fichiers a lieu au build /
 * au rendu serveur, jamais dans le navigateur.
 */
export function MediaImage({
  src,
  alt,
  className,
  sizes,
  priority,
  tone,
  kind,
  placeholderLabel,
  compactPlaceholder,
  ...dimensions
}: Props) {
  const media = resolveMedia(src);

  /*
   * Le SVG doit contourner l'optimiseur : `/_next/image` refuse les SVG par une
   * erreur 400 (« image type is not allowed ») tant que
   * `images.dangerouslyAllowSVG` n'est pas activé — ce qu'on ne veut pas, un
   * SVG pouvant embarquer du script. Sans cette ligne, un visuel fourni en
   * `.svg` (3ᵉ extension par ordre de priorité, voir `lib/media.ts`) s'afficherait
   * cassé. Même traitement que dans `brand/logo.tsx`.
   */
  const unoptimized = media.src.endsWith(".svg");

  if (!media.available) {
    return (
      <MediaPlaceholder
        tone={tone}
        kind={kind}
        label={placeholderLabel ?? alt}
        expectedPath={src}
        compact={compactPlaceholder}
        className={cn(
          dimensions.fill ? "absolute inset-0" : undefined,
          className,
        )}
      />
    );
  }

  if (dimensions.fill) {
    return (
      <Image
        src={media.src}
        alt={alt}
        fill
        // `sizes` est obligatoire en mode fill : sans lui, une image desktop
        // est livrée aux mobiles (section 11 du cahier des charges).
        sizes={sizes ?? "100vw"}
        priority={priority}
        unoptimized={unoptimized}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={media.src}
      alt={alt}
      width={dimensions.width}
      height={dimensions.height}
      sizes={sizes}
      priority={priority}
      unoptimized={unoptimized}
      className={className}
    />
  );
}
