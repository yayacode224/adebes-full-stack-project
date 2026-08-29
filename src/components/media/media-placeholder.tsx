import { Camera, Clapperboard, ImageIcon, Users } from "lucide-react";

import type { MediaTone } from "@/core/cms/entities/media-tone";
import { cn } from "@/lib/utils";

/**
 * `MediaTone` est désormais défini dans le domaine
 * (`src/core/cms/entities/media-tone.ts`) : c'est une donnée du contenu,
 * stockée en base sous l'énuméré `public.media_tone`, et `core/` n'a pas le
 * droit d'importer la couche présentation.
 *
 * Il est ré-exporté ici pour que les fichiers qui l'importaient de ce module
 * continuent de fonctionner sans modification. Il n'existe qu'une seule
 * définition.
 */
export type { MediaTone };

export type MediaKind = "photo" | "portrait" | "video" | "generic";

const TONES: Record<MediaTone, string> = {
  navy: "from-[#0f2d52] via-[#16406f] to-[#1b6fa8]",
  blue: "from-[#1b6fa8] via-[#2e8bc0] to-[#5cb4e6]",
  green: "from-[#1f5b23] via-[#2e7d32] to-[#4caf50]",
  orange: "from-[#a8560c] via-[#d97b23] to-[#f2994a]",
  neutral: "from-[#243b53] via-[#334e68] to-[#55708f]",
};

const ICONS: Record<MediaKind, typeof ImageIcon> = {
  photo: Camera,
  portrait: Users,
  video: Clapperboard,
  generic: ImageIcon,
};

/**
 * Emplacement visuel tenu en attendant la photothèque de l'association.
 *
 * Volontairement sobre et « intentionnel » plutôt que gris cassé : un
 * placeholder qui ressemble à une image manquante donne la même impression de
 * site inachevé que celle relevée dans l'audit. Il indique aussi, en
 * développement uniquement, le chemin exact du fichier attendu.
 */
export function MediaPlaceholder({
  tone = "navy",
  kind = "photo",
  label,
  expectedPath,
  className,
  compact = false,
}: {
  tone?: MediaTone;
  kind?: MediaKind;
  /** Description courte de ce que la photo doit montrer. */
  label?: string;
  /** Chemin attendu dans /public — affiché en développement seulement. */
  expectedPath?: string;
  className?: string;
  compact?: boolean;
}) {
  const Icon = ICONS[kind];
  const isDev = process.env.NODE_ENV === "development";

  return (
    <div
      aria-hidden="true"
      className={cn(
        "relative isolate flex h-full w-full items-center justify-center overflow-hidden bg-gradient-to-br",
        TONES[tone],
        className,
      )}
    >
      {/* Trame discrète : évite l'aplat plat qui « fait vide ». */}
      <div
        className="pointer-events-none absolute inset-0 opacity-25 mix-blend-overlay"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(255,255,255,.55) 1px, transparent 0)",
          backgroundSize: "14px 14px",
        }}
      />

      <div
        className={cn(
          "relative z-10 flex max-w-[85%] flex-col items-center gap-2 text-center text-white/90",
          compact && "gap-1",
        )}
      >
        <span
          className={cn(
            "grid place-items-center rounded-2xl border border-white/25 bg-white/10 backdrop-blur-[2px]",
            compact ? "size-9" : "size-12",
          )}
        >
          <Icon className={compact ? "size-4" : "size-5"} strokeWidth={1.75} />
        </span>

        {label && !compact ? (
          <span className="text-balance text-xs font-medium leading-snug text-white/85 sm:text-sm">
            {label}
          </span>
        ) : null}

        {isDev && expectedPath ? (
          <code className="mt-0.5 max-w-full truncate rounded bg-black/35 px-1.5 py-0.5 font-mono text-[10px] text-white/75">
            {expectedPath}
          </code>
        ) : null}
      </div>
    </div>
  );
}
