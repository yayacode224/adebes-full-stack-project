import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { CmsImage } from "@/components/media/cms-image";
import { MediaImage } from "@/components/media/media-image";
import { ContentIcon } from "@/components/ui-ext/content-icon";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import type { Programme } from "@/core/cms/entities/programme";
import { coverParDefaut } from "@/lib/programme-visuels";
import { cn } from "@/lib/utils";

/**
 * Carte de programme.
 *
 * Toute la carte est cliquable et mène à la page détail du programme : sur
 * l'ancien site, les 8 liens « En savoir plus » pointaient vers `#`
 * (constat #2 de l'audit).
 *
 * ---------------------------------------------------------------------------
 * CE QUI A CHANGÉ AU LOT 8A
 * ---------------------------------------------------------------------------
 * Le `Programme` reçu est celui du DOMAINE (`core/cms/entities/programme`),
 * plus celui de `src/content/`. Deux conséquences visibles ici :
 *
 *   * `icon` est une CHAÎNE (« GraduationCap »), résolue par `getIcon()`. Une
 *     base ne stocke pas un composant React ;
 *   * le visuel vient d'un identifiant de média, plus d'une convention de
 *     nommage de fichier.
 *
 * ---------------------------------------------------------------------------
 * DEUX SOURCES D'IMAGE, DANS CET ORDRE
 * ---------------------------------------------------------------------------
 * `cover` (la médiathèque) l'emporte ; à défaut, le fichier livré dans
 * `/public`. Voir `src/lib/programme-visuels.ts` pour le raisonnement complet :
 * `media_assets` est encore vide, et une bascule sans repli aurait remplacé
 * huit photographies par huit aplats de couleur.
 */
export function ProgrammeCard({
  programme,
  cover,
  className,
  priority = false,
}: {
  programme: Programme;
  /**
   * La couverture déjà résolue par la page.
   *
   * Résolue en amont et non ici : une carte qui va chercher son média
   * produirait une requête par carte, soit six sur l'accueil.
   */
  cover?: MediaAsset | null;
  className?: string;
  priority?: boolean;
}) {
  return (
    <article
      className={cn(
        "group relative flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card transition-all duration-300 hover:-translate-y-1 hover:shadow-lg motion-reduce:transition-none motion-reduce:hover:translate-y-0",
        className,
      )}
    >
      <div className="relative aspect-[4/3] overflow-hidden bg-muted">
        {cover ? (
          <CmsImage
            asset={cover}
            fill
            tone={programme.tone}
            priority={priority}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        ) : (
          <MediaImage
            src={coverParDefaut(programme.slug)}
            alt={`Programme ${programme.title} action d'ADEBES sur le terrain`}
            fill
            tone={programme.tone}
            priority={priority}
            sizes="(min-width: 1024px) 30vw, (min-width: 640px) 45vw, 90vw"
            className="transition-transform duration-500 group-hover:scale-[1.04] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        )}
      </div>

      <div className="flex flex-1 flex-col gap-3 p-5">
        <span className="grid size-10 place-items-center rounded-xl bg-primary/10 text-primary">
          <ContentIcon name={programme.icon} className="size-5" />
        </span>

        <h3 className="font-heading text-lg font-semibold leading-snug text-foreground">
          {/* Lien étendu : toute la carte devient une cible tactile. */}
          <Link
            href={`/programmes/${programme.slug}`}
            className="after:absolute after:inset-0 after:content-['']"
          >
            {programme.title}
          </Link>
        </h3>

        <p className="text-sm leading-relaxed text-muted-foreground">
          {programme.summary}
        </p>

        <span className="mt-auto inline-flex items-center gap-1.5 pt-2 text-sm font-medium text-primary">
          En savoir plus
          <ArrowRight
            className="size-4 transition-transform duration-300 group-hover:translate-x-1 motion-reduce:transition-none motion-reduce:group-hover:translate-x-0"
            aria-hidden="true"
          />
        </span>
      </div>
    </article>
  );
}
