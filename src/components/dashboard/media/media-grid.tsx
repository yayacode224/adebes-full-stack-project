"use client";

import { Check } from "lucide-react";

import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { formaterPoids } from "@/lib/media-url";
import { cn } from "@/lib/utils";

import { MediaThumbnail } from "./media-thumbnail";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA GRILLE DE VIGNETTES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagée par l'écran `/dashboard/mediatheque` et par le `<MediaPicker>` :
 * deux contextes, une seule grille. Les écrire séparément aurait produit deux
 * comportements de sélection différents pour un même geste.
 *
 * ---------------------------------------------------------------------------
 * NOMBRE DE COLONNES (§7.1 et §12 du Rapport 1)
 * ---------------------------------------------------------------------------
 *   * 2 colonnes sous `sm:` — un téléphone ;
 *   * 3 à 4 en tablette ;
 *   * 5 à 6 au-delà, **avec une borne haute**.
 *
 * La borne n'est pas dans cette grille : elle vient de la largeur de contenu du
 * dashboard, plafonnée à `max-w-(--breakpoint-2xl)` (96 rem). Six colonnes dans
 * 96 rem font des vignettes de 16 rem — soit 256 px, jamais « minuscules ».
 * Le §12 demandait la borne, pas un `max-width` de plus sur la grille.
 *
 * Tout est en CSS : aucune lecture de largeur en JavaScript (règle 9 du §12).
 *
 * ---------------------------------------------------------------------------
 * LA CARTE ENTIÈRE EST LE BOUTON
 * ---------------------------------------------------------------------------
 * Pas d'icône d'action de 24 px dans un coin : la cible tactile est la carte,
 * donc largement au-delà des 44 px de la règle 4. Et aucune information ne
 * dépend du survol (règle 8) — le nom et le poids sont écrits sous la vignette,
 * pas révélés au passage de la souris.
 */
export function MediaGrid({
  medias,
  onOuvrir,
  selection,
  libelleAction = "Ouvrir la fiche de",
  className,
}: {
  medias: readonly MediaAsset[];
  onOuvrir: (media: MediaAsset) => void;
  /** Identifiants actuellement choisis — coche et `aria-pressed`. */
  selection?: ReadonlySet<string>;
  /** Début du nom accessible du bouton : « Ouvrir la fiche de », « Choisir ». */
  libelleAction?: string;
  className?: string;
}) {
  return (
    <ul
      className={cn(
        "grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 2xl:grid-cols-6",
        className,
      )}
    >
      {medias.map((media, index) => {
        const choisi = selection?.has(media.id) ?? false;

        return (
          <li key={media.id}>
            <button
              type="button"
              onClick={() => onOuvrir(media)}
              aria-pressed={selection ? choisi : undefined}
              /*
                Le nom accessible combine l'action, le nom du fichier et sa
                description : « Choisir photo-atelier.webp — Atelier de
                couture à Bafoussam ». Un lecteur d'écran qui n'annoncerait
                que « photo-atelier.webp » ne dirait rien de l'image.
              */
              aria-label={`${libelleAction} ${media.filename} — ${media.altText}`}
              className={cn(
                "group flex w-full flex-col overflow-hidden rounded-xl border bg-card text-left transition-colors",
                "focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none",
                choisi
                  ? "border-primary ring-2 ring-primary"
                  : "border-border hover:border-primary/50 hover:bg-muted/40",
              )}
            >
              <span className="relative block">
                <MediaThumbnail
                  asset={media}
                  /*
                    Deux colonnes sur un téléphone, six sur un grand écran :
                    la vignette ne dépasse jamais la moitié de la largeur en
                    mobile ni le sixième au-delà. Sans ce `sizes`, `next/image`
                    livrerait la version pleine largeur à un téléphone.
                  */
                  sizes="(max-width: 639px) 50vw, (max-width: 767px) 33vw, (max-width: 1023px) 25vw, (max-width: 1535px) 20vw, 16vw"
                  priority={index < 4}
                />

                {choisi ? (
                  <span
                    aria-hidden="true"
                    className="absolute right-2 top-2 flex size-6 items-center justify-center rounded-full bg-primary text-primary-foreground shadow"
                  >
                    <Check className="size-4" />
                  </span>
                ) : null}
              </span>

              <span className="flex min-w-0 flex-col gap-0.5 px-2.5 py-2">
                <span className="truncate text-sm font-medium text-foreground">
                  {media.filename}
                </span>
                <span className="truncate text-xs text-muted-foreground">
                  {formaterPoids(media.sizeBytes)}
                  {media.folder ? ` · ${media.folder}` : ""}
                </span>
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
}
