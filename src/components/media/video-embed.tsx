import { Clapperboard } from "lucide-react";

import { cn } from "@/lib/utils";

import { MediaImage } from "./media-image";
import type { MediaTone } from "./media-placeholder";
import { VideoPlayer } from "./video-player";

export type VideoSource =
  | { provider: "youtube"; id: string }
  | { provider: "vimeo"; id: string }
  | null;

function embedUrl(source: NonNullable<VideoSource>): string {
  // youtube-nocookie : pas de cookie tiers tant que la vidéo n'est pas lue.
  return source.provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${source.id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${source.id}?autoplay=1`;
}

/**
 * Intégration vidéo.
 *
 * Aucun fichier vidéo n'est stocké dans le dépôt (section 8 du cahier des
 * charges) : les vidéos sont hébergées sur une plateforme externe et
 * référencées par leur identifiant, avec une image d'aperçu locale optimisée.
 *
 * Tant qu'aucune source n'est renseignée, on affiche l'emplacement sans bouton
 * de lecture — jamais un lecteur qui ne lit rien.
 */
export function VideoEmbed({
  source,
  title,
  poster,
  posterAlt,
  tone = "navy",
  className,
}: {
  source: VideoSource;
  title: string;
  /** Chemin de l'image d'aperçu dans /public. */
  poster: string;
  posterAlt: string;
  tone?: MediaTone;
  className?: string;
}) {
  const posterNode = (
    <MediaImage
      src={poster}
      alt={posterAlt}
      fill
      kind="video"
      tone={tone}
      sizes="(min-width: 1024px) 60vw, 100vw"
    />
  );

  return (
    <div
      className={cn(
        "relative aspect-video w-full overflow-hidden rounded-2xl bg-muted",
        className,
      )}
    >
      {source ? (
        <VideoPlayer
          embedUrl={embedUrl(source)}
          title={title}
          poster={posterNode}
        />
      ) : (
        <>
          {posterNode}
          <div className="scrim-soft absolute inset-0" aria-hidden="true" />
          <p className="absolute bottom-3 left-3 right-3 flex items-center gap-2 text-xs font-medium text-white/90">
            <Clapperboard className="size-4 shrink-0" aria-hidden="true" />
            <span className="text-balance">
              Vidéo à venir — {title}
            </span>
          </p>
        </>
      )}
    </div>
  );
}
