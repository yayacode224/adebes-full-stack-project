"use client";

import { ChevronLeft, ChevronRight, ZoomIn } from "lucide-react";
import { useCallback, useEffect, useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export type GalleryEntry = {
  id: string;
  category: string;
  categoryLabel: string;
  alt: string;
  /** Vignette rendue côté serveur. */
  thumb: ReactNode;
  /** Version pleine taille, rendue côté serveur elle aussi. */
  full: ReactNode;
};

/**
 * Grille filtrable + visionneuse plein écran.
 *
 * Le filtre par catégorie de l'ancien site était l'un de ses rares bons
 * patterns (audit §2) : il est conservé, fiabilisé et rendu navigable au
 * clavier — flèches pour circuler entre les photos, Échap pour fermer.
 */
export function GalleryGrid({
  entries,
  categories,
}: {
  entries: GalleryEntry[];
  categories: { slug: string; label: string }[];
}) {
  const [active, setActive] = useState<string>("all");
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const visible =
    active === "all"
      ? entries
      : entries.filter((entry) => entry.category === active);

  const go = useCallback(
    (direction: 1 | -1) => {
      setOpenIndex((current) => {
        if (current === null) return null;
        const next = current + direction;
        if (next < 0) return visible.length - 1;
        if (next >= visible.length) return 0;
        return next;
      });
    },
    [visible.length],
  );

  useEffect(() => {
    if (openIndex === null) return;

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "ArrowRight") go(1);
      if (event.key === "ArrowLeft") go(-1);
    };

    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [openIndex, go]);

  const current = openIndex !== null ? visible[openIndex] : null;

  return (
    <div>
      <div
        role="group"
        aria-label="Filtrer la galerie par catégorie"
        className="flex flex-wrap gap-2"
      >
        <Button
          variant={active === "all" ? "default" : "outline"}
          size="sm"
          aria-pressed={active === "all"}
          onClick={() => {
            setActive("all");
            setOpenIndex(null);
          }}
        >
          Tous
        </Button>

        {categories.map((category) => (
          <Button
            key={category.slug}
            variant={active === category.slug ? "default" : "outline"}
            size="sm"
            aria-pressed={active === category.slug}
            onClick={() => {
              setActive(category.slug);
              setOpenIndex(null);
            }}
          >
            {category.label}
          </Button>
        ))}
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
        {visible.length} photo{visible.length > 1 ? "s" : ""}
      </p>

      <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {visible.map((entry, index) => (
          <li key={entry.id}>
            <button
              type="button"
              onClick={() => setOpenIndex(index)}
              className="group relative block aspect-square w-full overflow-hidden rounded-xl bg-muted focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
            >
              {entry.thumb}

              <span
                aria-hidden="true"
                className="absolute inset-0 flex items-center justify-center bg-[#06121e]/0 transition-colors duration-300 group-hover:bg-[#06121e]/45 motion-reduce:transition-none"
              >
                <ZoomIn className="size-6 text-white opacity-0 transition-opacity duration-300 group-hover:opacity-100 motion-reduce:transition-none" />
              </span>

              <span className="sr-only">Agrandir : {entry.alt}</span>
            </button>
          </li>
        ))}
      </ul>

      <Dialog
        open={openIndex !== null}
        onOpenChange={(open) => !open && setOpenIndex(null)}
      >
        <DialogContent
          showCloseButton
          className="max-w-5xl gap-0 overflow-hidden border-white/10 bg-[#06121e] p-0 text-white sm:rounded-2xl"
        >
          {current ? (
            <>
              <DialogTitle className="sr-only">{current.alt}</DialogTitle>
              <DialogDescription className="sr-only">
                Photo {(openIndex ?? 0) + 1} sur {visible.length}. Utilisez les
                flèches gauche et droite pour naviguer.
              </DialogDescription>

              <div className="relative aspect-[4/3] w-full bg-black sm:aspect-video">
                {current.full}
              </div>

              <div className="flex items-center justify-between gap-3 px-4 py-3">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => go(-1)}
                  aria-label="Photo précédente"
                  className="text-white hover:bg-white/15 hover:text-white"
                  disabled={visible.length < 2}
                >
                  <ChevronLeft className="size-5" aria-hidden="true" />
                </Button>

                <p
                  className={cn(
                    "min-w-0 flex-1 text-center text-xs text-white/75 sm:text-sm",
                  )}
                >
                  <span className="line-clamp-2">{current.alt}</span>
                  <span className="mt-0.5 block text-white/45">
                    {current.categoryLabel} · {(openIndex ?? 0) + 1}/
                    {visible.length}
                  </span>
                </p>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => go(1)}
                  aria-label="Photo suivante"
                  className="text-white hover:bg-white/15 hover:text-white"
                  disabled={visible.length < 2}
                >
                  <ChevronRight className="size-5" aria-hidden="true" />
                </Button>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}
