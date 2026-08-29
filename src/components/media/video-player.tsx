"use client";

import { Play } from "lucide-react";
import { useState, type ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * Lecteur « façade » : tant que l'utilisateur n'a pas cliqué, seule l'image
 * d'aperçu est chargée. L'iframe du prestataire (et ses ~500 Ko de scripts)
 * n'est injectée qu'au clic.
 *
 * L'audit a relevé un public naviguant majoritairement sur données mobiles :
 * charger un lecteur vidéo tiers sur chaque page serait un coût direct en
 * taux d'abandon.
 */
export function VideoPlayer({
  embedUrl,
  title,
  poster,
  className,
}: {
  embedUrl: string;
  title: string;
  /** Image d'aperçu rendue côté serveur (voir MediaImage). */
  poster: ReactNode;
  className?: string;
}) {
  const [playing, setPlaying] = useState(false);

  if (playing) {
    return (
      <iframe
        src={embedUrl}
        title={title}
        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
        allowFullScreen
        className={cn("absolute inset-0 size-full border-0", className)}
      />
    );
  }

  return (
    <button
      type="button"
      onClick={() => setPlaying(true)}
      className={cn(
        "group absolute inset-0 size-full cursor-pointer",
        className,
      )}
    >
      {poster}
      <span className="scrim-soft absolute inset-0" aria-hidden="true" />
      <span
        aria-hidden="true"
        className="absolute left-1/2 top-1/2 grid size-16 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white/95 text-brand-navy shadow-lg transition-transform duration-300 group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
      >
        <Play className="ml-0.5 size-6 fill-current" />
      </span>
      <span className="sr-only">Lire la vidéo : {title}</span>
    </button>
  );
}
