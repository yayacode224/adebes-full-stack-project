"use client";

import { ChevronLeft, ChevronRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Pagination.
 *
 * ---------------------------------------------------------------------------
 * DEUX PRÉSENTATIONS (§6.1)
 * ---------------------------------------------------------------------------
 *   * `< 768 px` : « Précédent / Suivant » + « page X sur Y », boutons 44 px.
 *     Une pagination numérotée à 44 px de cible tactile ne tient pas sur 320 px
 *     au-delà de trois pages ;
 *   * `≥ 768 px` : pagination numérotée, avec ellipses quand il y a beaucoup
 *     de pages.
 *
 * Les deux formes annoncent la même information au lecteur d'écran
 * (`aria-live` sur le compteur) : changer de page sans retour audible laisse
 * croire que rien ne s'est passé.
 */
export function DataTablePagination({
  page,
  pages,
  total,
  debut,
  fin,
  itemLabel,
  onPage,
}: {
  /** Index de page à partir de 1. */
  page: number;
  pages: number;
  total: number;
  /** Rang du premier élément affiché, à partir de 1. */
  debut: number;
  fin: number;
  itemLabel: string;
  onPage: (page: number) => void;
}) {
  if (pages <= 1) {
    return (
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {total} {itemLabel}
        {total > 1 ? "s" : ""}
      </p>
    );
  }

  return (
    <nav
      aria-label="Pagination"
      className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"
    >
      <p aria-live="polite" className="text-xs text-muted-foreground">
        {debut}–{fin} sur {total} {itemLabel}
        {total > 1 ? "s" : ""} · page {page} sur {pages}
      </p>

      <div className="flex items-center gap-1">
        <Button
          type="button"
          variant="outline"
          onClick={() => onPage(page - 1)}
          disabled={page === 1}
          className="flex-1 sm:flex-none"
        >
          <ChevronLeft className="size-4" aria-hidden="true" />
          Précédent
        </Button>

        {/* --- Numéros, à partir de 768 px --------------------------------- */}
        <ul className="hidden items-center gap-1 md:flex">
          {numeros(page, pages).map((numero, index) =>
            numero === null ? (
              <li
                key={`ellipse-${index}`}
                aria-hidden="true"
                className="px-1 text-sm text-muted-foreground"
              >
                …
              </li>
            ) : (
              <li key={numero}>
                <Button
                  type="button"
                  variant={numero === page ? "default" : "ghost"}
                  size="icon"
                  aria-label={`Page ${numero}`}
                  aria-current={numero === page ? "page" : undefined}
                  onClick={() => onPage(numero)}
                  className={cn(numero === page && "pointer-events-none")}
                >
                  {numero}
                </Button>
              </li>
            ),
          )}
        </ul>

        <Button
          type="button"
          variant="outline"
          onClick={() => onPage(page + 1)}
          disabled={page === pages}
          className="flex-1 sm:flex-none"
        >
          Suivant
          <ChevronRight className="size-4" aria-hidden="true" />
        </Button>
      </div>
    </nav>
  );
}

/**
 * Les numéros à afficher, `null` marquant une ellipse.
 *
 * Toujours la première et la dernière page, plus une fenêtre autour de la page
 * courante : sans les extrémités, on ne peut plus revenir au début d'une liste
 * de quarante pages sans cliquer quarante fois.
 */
function numeros(page: number, pages: number): (number | null)[] {
  if (pages <= 7) {
    return Array.from({ length: pages }, (_, index) => index + 1);
  }

  const fenetre = new Set<number>([1, pages, page, page - 1, page + 1]);
  const retenus = [...fenetre]
    .filter((numero) => numero >= 1 && numero <= pages)
    .sort((a, b) => a - b);

  const sortie: (number | null)[] = [];
  let precedent = 0;

  for (const numero of retenus) {
    if (precedent && numero - precedent > 1) sortie.push(null);
    sortie.push(numero);
    precedent = numero;
  }

  return sortie;
}
