import { FileText } from "lucide-react";
import Image from "next/image";

import { estImage, type MediaAsset } from "@/core/cms/entities/media-asset";
import { doitResterNonOptimise, urlMedia } from "@/lib/media-url";
import { cn } from "@/lib/utils";

/**
 * Vignette d'un média.
 *
 * ---------------------------------------------------------------------------
 * `aspect-square object-cover`, ET C'EST UNE EXIGENCE (§7.1)
 * ---------------------------------------------------------------------------
 * « Une grille d'images de proportions libres devient illisible en deux
 * colonnes » : les lignes se décalent, la grille ondule, et l'œil ne peut plus
 * balayer. Le carré est ce qui rend la médiathèque parcourable au téléphone.
 *
 * ---------------------------------------------------------------------------
 * UN PDF N'EST PAS UNE IMAGE ABSENTE
 * ---------------------------------------------------------------------------
 * Il a sa propre représentation — icône, extension, nom — plutôt qu'un
 * `MediaPlaceholder` qui suggérerait un visuel manquant. Distinguer « ce
 * fichier n'est pas une image » de « cette image n'a pas pu être chargée » est
 * la même discipline que l'invariant nº 1 appliquée aux vignettes.
 */
export function MediaThumbnail({
  asset,
  sizes,
  className,
  priority,
}: {
  asset: MediaAsset;
  /** Obligatoire en mode `fill` : sans lui, le mobile reçoit l'image du bureau. */
  sizes: string;
  className?: string;
  priority?: boolean;
}) {
  const url = urlMedia(asset);

  if (!estImage(asset.mimeType) || !url) {
    return (
      <div
        className={cn(
          "flex aspect-square w-full flex-col items-center justify-center gap-1.5 bg-muted p-3 text-center",
          className,
        )}
      >
        <FileText
          className="size-7 text-muted-foreground"
          aria-hidden="true"
          strokeWidth={1.75}
        />
        <span className="line-clamp-2 text-xs font-medium text-muted-foreground">
          {asset.filename}
        </span>
      </div>
    );
  }

  return (
    <div className={cn("relative aspect-square w-full bg-muted", className)}>
      <Image
        src={url}
        /*
          `alt=""` : la vignette est TOUJOURS accompagnée du nom du fichier et
          de sa description dans la carte qui l'entoure. Répéter le texte
          alternatif ici ferait annoncer deux fois la même chose au lecteur
          d'écran — l'image est décorative dans ce contexte précis, elle ne
          l'est nulle part ailleurs.
        */
        alt=""
        fill
        sizes={sizes}
        priority={priority}
        unoptimized={doitResterNonOptimise(asset.mimeType)}
        className="object-cover"
      />
    </div>
  );
}
