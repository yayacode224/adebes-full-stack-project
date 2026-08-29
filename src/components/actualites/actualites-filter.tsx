"use client";

import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";

/**
 * ⚠️  `category` est désormais un LIBELLÉ libre, plus une union littérale.
 *
 * Au Lot 8B, les catégories sont devenues une table gérable depuis le
 * dashboard : leur liste n'est plus connue à la compilation, et un type
 * `ActualiteCategory` figé aurait interdit d'en créer une nouvelle. La page
 * fournit donc les libellés qu'elle a lus en base — et seulement ceux qui sont
 * réellement représentés parmi les articles affichés.
 */
export type FilterableArticle = {
  id: string;
  /** Libellé de la catégorie, ou `null` pour un article sans catégorie. */
  category: string | null;
  /** Carte pré-rendue côté serveur (elle contient une image next/image). */
  node: ReactNode;
};

/**
 * Filtre par catégorie.
 *
 * Les cartes sont rendues par le serveur puis passées ici en `ReactNode` : le
 * filtrage n'est qu'un masquage côté client. La page reste entièrement
 * statique, et toutes les cartes sont dans le HTML initial — donc indexables,
 * quelle que soit la catégorie sélectionnée.
 */
export function ActualitesFilter({
  articles,
  categories,
}: {
  articles: FilterableArticle[];
  categories: string[];
}) {
  /*
    `null` = « Toutes », et non une chaîne sentinelle comme « all ».

    Les libellés viennent désormais de la base : rien n'empêche quelqu'un de
    créer une catégorie nommée « all ». Une sentinelle textuelle aurait alors
    rendu ce bouton indistinguable du bouton « Toutes » — un défaut rare,
    impossible à reproduire, et évitable en une ligne.
  */
  const [active, setActive] = useState<string | null>(null);

  const visible =
    active === null
      ? articles
      : articles.filter((article) => article.category === active);

  return (
    <div>
      <div
        role="group"
        aria-label="Filtrer les actualités par catégorie"
        className="flex flex-wrap gap-2"
      >
        <Button
          variant={active === null ? "default" : "outline"}
          size="sm"
          aria-pressed={active === null}
          onClick={() => setActive(null)}
        >
          Toutes
        </Button>

        {categories.map((category) => (
          <Button
            key={category}
            variant={active === category ? "default" : "outline"}
            size="sm"
            aria-pressed={active === category}
            onClick={() => setActive(category)}
          >
            {category}
          </Button>
        ))}
      </div>

      <p aria-live="polite" className="mt-4 text-sm text-muted-foreground">
        {visible.length} article{visible.length > 1 ? "s" : ""}
        {active === null ? "" : ` dans « ${active} »`}
      </p>

      {visible.length > 0 ? (
        <ul className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {visible.map((article) => (
            <li key={article.id}>{article.node}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-10 rounded-2xl border border-dashed border-border p-10 text-center text-sm text-muted-foreground">
          Aucun article dans cette catégorie pour le moment.
        </p>
      )}
    </div>
  );
}
