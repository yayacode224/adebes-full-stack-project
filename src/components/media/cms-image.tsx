import Image from "next/image";

import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { doitResterNonOptimise, urlMedia } from "@/lib/media-url";
import { cn } from "@/lib/utils";

import {
  MediaPlaceholder,
  type MediaKind,
  type MediaTone,
} from "./media-placeholder";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  L'IMAGE VENUE DU CMS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §7.4 du Rapport 2. Jumeau de `MediaImage`, avec une seule différence : la
 * source n'est plus un chemin dans `/public` résolu par `fs.statSync`, mais un
 * `MediaAsset` venu de la base (décision D5).
 *
 * Les deux coexistent volontairement pendant les Lots 8 à 15 : les visuels de
 * marque restent dans `/public` (§5 du Rapport 1), seul le contenu éditorial
 * passe par Storage. `MediaImage` ne disparaîtra donc pas.
 *
 * ---------------------------------------------------------------------------
 * TROIS COMPORTEMENTS HÉRITÉS DU SITE ACTUEL, CONSERVÉS À L'IDENTIQUE
 * ---------------------------------------------------------------------------
 *  1. **Repli sur `MediaPlaceholder`** dès que l'image manque — asset absent,
 *     référence morte, variable d'environnement non renseignée. Le site n'a
 *     jamais d'icône d'image cassée, et c'est l'invariant nº 2 rendu visible.
 *  2. **`sizes` obligatoire en mode `fill`** : sans lui, `next/image` livre
 *     l'image du bureau à un téléphone.
 *  3. **SVG non optimisé** : `/_next/image` refuse les SVG tant que
 *     `dangerouslyAllowSVG` n'est pas activé, et l'activer ferait servir depuis
 *     notre domaine un format qui peut embarquer du script.
 *
 * ---------------------------------------------------------------------------
 * LE TEXTE ALTERNATIF VIENT DE LA BASE, PAS DE L'APPELANT
 * ---------------------------------------------------------------------------
 * `media_assets.alt_text` est `not null` et le formulaire de téléversement
 * l'exige. La description est donc saisie UNE fois, par la personne qui connaît
 * la photo, et suit l'image partout où elle est employée.
 *
 * `alt` reste surchargeable, pour le seul cas légitime : une image purement
 * décorative dans un contexte donné, qui doit alors passer `alt=""`.
 */

type ProprietesCommunes = {
  /** L'asset, ou `null` quand la référence ne pointe plus sur rien. */
  asset: MediaAsset | null | undefined;
  /**
   * Surcharge du texte alternatif.
   *
   * À n'employer que pour neutraliser une image décorative (`alt=""`). Dans
   * tous les autres cas, la description de la médiathèque fait autorité.
   */
  alt?: string;
  className?: string;
  sizes?: string;
  priority?: boolean;
  tone?: MediaTone;
  kind?: MediaKind;
  /** Libellé du repli, si le texte alternatif ne convient pas à l'écran vide. */
  placeholderLabel?: string;
  compactPlaceholder?: boolean;
};

type Proprietes = ProprietesCommunes &
  (
    | { fill: true; width?: never; height?: never }
    | { fill?: false; width: number; height: number }
  );

export function CmsImage({
  asset,
  alt,
  className,
  sizes,
  priority,
  tone,
  kind,
  placeholderLabel,
  compactPlaceholder,
  ...dimensions
}: Proprietes) {
  const url = urlMedia(asset);

  /*
   * Repli. Trois causes possibles, un seul rendu — et c'est voulu : du point
   * de vue du visiteur, « pas encore illustré » et « référence cassée » sont
   * la même chose, et aucune des deux ne doit ressembler à une panne.
   *
   * Le `label` reprend la description quand elle existe : un placeholder qui
   * annonce ce que l'image DEVAIT montrer reste informatif.
   */
  if (!asset || !url) {
    return (
      <MediaPlaceholder
        tone={tone}
        kind={kind}
        label={placeholderLabel ?? asset?.altText ?? alt}
        compact={compactPlaceholder}
        className={cn(dimensions.fill ? "absolute inset-0" : undefined, className)}
      />
    );
  }

  const texteAlternatif = alt ?? asset.altText;
  const nonOptimise = doitResterNonOptimise(asset.mimeType);

  if (dimensions.fill) {
    return (
      <Image
        src={url}
        alt={texteAlternatif}
        fill
        sizes={sizes ?? "100vw"}
        priority={priority}
        unoptimized={nonOptimise}
        className={cn("object-cover", className)}
      />
    );
  }

  return (
    <Image
      src={url}
      alt={texteAlternatif}
      width={dimensions.width}
      height={dimensions.height}
      sizes={sizes}
      priority={priority}
      unoptimized={nonOptimise}
      className={className}
    />
  );
}
