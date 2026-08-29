import { Quote } from "lucide-react";

import { CmsImage } from "@/components/media/cms-image";
import { MediaPlaceholder } from "@/components/media/media-placeholder";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import type { Testimonial } from "@/core/cms/entities/testimonial";
import { cn } from "@/lib/utils";

/**
 * Carte de témoignage.
 *
 * ---------------------------------------------------------------------------
 * CE QUI A CHANGÉ AU LOT 8C
 * ---------------------------------------------------------------------------
 * Le `Testimonial` reçu est celui du DOMAINE
 * (`core/cms/entities/testimonial`), plus le type `Temoignage` de
 * `src/content/`. Trois conséquences visibles ici :
 *
 *   * `quote`, `name`, `role` deviennent `quote`, `authorName`, `authorRole` ;
 *   * le portrait vient d'un identifiant de média, résolu par la page ;
 *   * le badge « Témoignage à recueillir » DISPARAÎT. La table `testimonials`
 *     n'a pas de colonne équivalente à `articles.is_placeholder`, et les trois
 *     entrées actuelles portaient `placeholder: false` : le badge n'était rendu
 *     nulle part. Le rendu est donc inchangé.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE REPLI SUR `/public`, CONTRAIREMENT AUX PROGRAMMES ET AUX ARTICLES
 * ---------------------------------------------------------------------------
 * C'est l'écart le plus visible de ce lot, et il est délibéré.
 *
 * Les Lots 8A et 8B ont gardé un pont vers `/public` — `coverParDefaut(slug)`,
 * `actualiteCover(slug)` — parce que leur convention de nommage est indexée
 * sur le SLUG, qui existe encore en base. Les photos de témoignages, elles,
 * suivent `temoignage-<id>.jpg` où `<id>` est l'identifiant du TABLEAU
 * TypeScript (« exemple-beneficiaire »). Cet identifiant n'existe plus : en
 * base, c'est un UUID.
 *
 * Aucune colonne de `testimonials` ne peut le remplacer sans danger :
 *
 *   * `position` change à chaque réordonnancement — le portrait suivrait le
 *     rang, pas la personne ;
 *   * `author_name` n'est pas unique — les trois entrées actuelles s'appellent
 *     toutes « Prénom ».
 *
 * Dans les deux cas, le pont finirait par afficher le visage d'une personne
 * réelle À CÔTÉ DES PAROLES D'UNE AUTRE. C'est précisément le préjudice que la
 * règle de consentement de ce lot existe pour empêcher, et il serait causé par
 * le mécanisme censé préserver le rendu. Le repli est donc supprimé plutôt
 * qu'adapté.
 *
 * Conséquence assumée et signalée : tant que les portraits n'ont pas été
 * téléversés dans la médiathèque et choisis dans le champ « Photo », les trois
 * témoignages affichent l'emplacement tenu de `<MediaPlaceholder>` — le même
 * qu'ils affichaient déjà avant que les fichiers soient déposés dans
 * `/public`. Les fichiers restent sur le disque, rien n'est perdu.
 */
export function TestimonialCard({
  temoignage,
  photo,
  className,
}: {
  temoignage: Testimonial;
  /**
   * Le portrait déjà résolu par la page.
   *
   * Résolu en amont et non ici : une carte qui va chercher son média
   * produirait une requête par carte, soit trois sur l'accueil.
   */
  photo?: MediaAsset | null;
  className?: string;
}) {
  return (
    <figure
      className={cn(
        "flex h-full flex-col gap-4 rounded-2xl border border-border bg-card p-6",
        className,
      )}
    >
      <Quote
        className="size-7 shrink-0 text-brand-blue/40"
        aria-hidden="true"
      />

      <blockquote className="flex-1 text-[0.95rem] leading-relaxed text-foreground">
        {temoignage.quote}
      </blockquote>

      <figcaption className="flex items-center gap-3 border-t border-border pt-4">
        <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-muted">
          {photo ? (
            /*
              Pas de prop `alt` : `media_assets.alt_text` fait autorité, et il
              est saisi par la personne qui connaît la photo. C'est le contrat
              de `<CmsImage>`, où la surcharge est réservée au seul cas
              légitime — neutraliser une image décorative par `alt=""`. Un
              portrait ne l'est pas.
            */
            <CmsImage asset={photo} fill tone="neutral" sizes="44px" />
          ) : (
            <MediaPlaceholder
              kind="portrait"
              tone="neutral"
              compact
              label={`Portrait de ${temoignage.authorName}`}
              className="absolute inset-0"
            />
          )}
        </span>

        <span className="min-w-0">
          <span className="block truncate text-sm font-semibold text-foreground">
            {temoignage.authorName}
          </span>
          <span className="block truncate text-xs text-muted-foreground">
            {temoignage.authorRole}
          </span>
        </span>
      </figcaption>
    </figure>
  );
}
