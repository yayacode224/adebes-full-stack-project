import {
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "@/core/cms/entities/content-status";
import { cn } from "@/lib/utils";

/**
 * État éditorial d'un contenu.
 *
 * ---------------------------------------------------------------------------
 * COULEUR **ET** LIBELLÉ — JAMAIS LA COULEUR SEULE
 * ---------------------------------------------------------------------------
 * C'est une contrainte d'accessibilité du projet (§12 du Rapport 1), pas une
 * préférence esthétique : une pastille verte muette ne dit rien à une
 * personne daltonienne, et rien du tout à un lecteur d'écran. Le libellé est
 * donc du texte, toujours rendu, jamais un `title` ni un `aria-label`
 * compensatoire.
 *
 * Une seconde redondance est ajoutée : chaque état porte une **forme de point
 * distincte** (plein, cerclé, plein, atténué). Deux états peuvent se
 * ressembler en niveaux de gris ; leur point, non.
 *
 * Les libellés viennent de `core/cms/entities/content-status.ts` : le domaine
 * les possède, la présentation les affiche. Renommer « En ligne » se fait à un
 * seul endroit, et le site public comme le dashboard suivent.
 *
 * ---------------------------------------------------------------------------
 * CONTRASTE — MESURÉ, PAS SUPPOSÉ
 * ---------------------------------------------------------------------------
 * La première version posait une teinte translucide derrière chaque libellé
 * (`bg-brand-orange/15`, `bg-success/12`). La recette du lot, qui compose les
 * couches alpha et relit le pixel, a mesuré **4,40:1** pour « À relire »,
 * **4,08:1** pour « En ligne » et **4,42:1** pour « Archivé » en thème clair —
 * sous le seuil AA de 4,5:1, alors que les mêmes encres passent largement sur
 * fond blanc. Un fond translucide fait perdre au texte le contraste que le
 * jeton lui garantissait.
 *
 * Deux règles en sont tirées, applicables à tout ce que les lots suivants
 * ajouteront :
 *
 *   1. **Pas de texte sur un fond translucide non mesuré.** Soit le fond est
 *      opaque et le couple est vérifiable une fois pour toutes, soit il n'y a
 *      pas de fond.
 *   2. **Une paire de jetons conçue ensemble** (`--accent` / `--accent-foreground`)
 *      vaut mieux qu'une couleur d'accent diluée dans du blanc.
 *
 * Les quatre états se distinguent donc par la FORME autant que par la couleur —
 * plein, cerclé, plein, tireté — ce qui les rend lisibles en niveaux de gris.
 */
const STYLES: Record<ContentStatus, { badge: string; point: string }> = {
  draft: {
    // #0f2d52 sur #eaf1f7 → 11,8:1
    badge: "border-border bg-secondary text-secondary-foreground",
    point: "bg-muted-foreground",
  },
  in_review: {
    /*
      « outline + teinte orange », littéralement ce que demande le §6.4 : le
      fond reste celui de la surface, seuls le texte et la bordure portent la
      teinte. #a8560c sur #fafafa → 4,9:1 ; sur une ligne de tableau → 4,7:1.
    */
    badge:
      "border-brand-orange-ink/40 text-brand-orange-ink dark:border-brand-orange/50 dark:text-brand-orange",
    // Cerclé plutôt que plein : « en cours », par opposition aux états stables.
    point: "border-2 border-brand-orange-ink bg-transparent dark:border-brand-orange",
  },
  published: {
    /*
      `--accent` / `--accent-foreground` : la paire verte de `globals.css`,
      opaque et conçue l'une pour l'autre — 7,2:1 en clair, 8,4:1 en sombre.
      `--success` reste la couleur du point : c'est lui qui porte l'identité
      « en ligne », et un point n'a pas de texte à porter.
    */
    badge: "border-accent-foreground/25 bg-accent text-accent-foreground",
    point: "bg-success",
  },
  archived: {
    /*
      Bordure TIRETÉE et fond transparent : « rangé », sans dépendre d'une
      nuance de gris. Sur `bg-muted` opaque, `text-muted-foreground` tombait à
      4,42:1 ; sur la surface, il remonte à 4,9:1.
    */
    badge: "border-dashed border-border text-muted-foreground",
    point: "bg-muted-foreground/50",
  },
};

export function StatusBadge({
  status,
  className,
}: {
  status: ContentStatus;
  className?: string;
}) {
  const style = STYLES[status];

  return (
    <span
      data-status={status}
      className={cn(
        "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-2 py-0.5 text-xs font-medium whitespace-nowrap",
        style.badge,
        className,
      )}
    >
      <span
        aria-hidden="true"
        className={cn("size-1.5 shrink-0 rounded-full", style.point)}
      />
      {CONTENT_STATUS_LABELS[status]}
    </span>
  );
}
