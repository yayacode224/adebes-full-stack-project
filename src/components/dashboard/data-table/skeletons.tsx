import { Skeleton } from "@/components/ui/skeleton";

/**
 * Squelettes de chargement — DANS LES DEUX FORMES.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI DEUX, ET POURQUOI PAS UN SPINNER
 * ---------------------------------------------------------------------------
 * Le §6.1 est explicite sur les deux points :
 *
 *   * « squelettes, pas de spinner seul » — un spinner ne réserve aucune
 *     place ; à l'arrivée des données, toute la page saute. Un squelette
 *     occupe l'espace que le contenu occupera ;
 *   * « les squelettes existent dans les deux formes — cartes sous 768 px,
 *     lignes de tableau au-dessus — sinon le chargement provoque un saut de
 *     mise en page à chaque affichage mobile ».
 *
 * ---------------------------------------------------------------------------
 * ICI, ET SEULEMENT ICI, LES DEUX FORMES COEXISTENT DANS LE DOM
 * ---------------------------------------------------------------------------
 * L'interdiction du §6.1 de rendre les deux formes en parallèle vise le
 * CONTENU : dupliquer les lignes réelles ferait tout lire deux fois au lecteur
 * d'écran. Un squelette ne porte aucun contenu — il est entièrement
 * `aria-hidden`, et une seule annonce (« Chargement de la liste ») est émise
 * par le conteneur. La bascule peut donc se faire en CSS, ce qui est
 * précisément ce qu'il faut : le squelette est rendu par le serveur, avant
 * qu'aucune media query n'ait été lue en JavaScript, et il a déjà la bonne
 * forme au premier pixel peint.
 */
export function DataTableSkeleton({
  colonnes,
  lignes = 5,
}: {
  colonnes: number;
  lignes?: number;
}) {
  return (
    <div role="status" aria-busy="true" aria-label="Chargement de la liste">
      <div aria-hidden="true" className="md:hidden">
        <CardsSkeleton lignes={lignes} />
      </div>
      <div aria-hidden="true" className="hidden md:block">
        <TableSkeleton colonnes={colonnes} lignes={lignes} />
      </div>
    </div>
  );
}

/** Squelette de tableau — à partir de 768 px. */
function TableSkeleton({ colonnes, lignes }: { colonnes: number; lignes: number }) {
  return (
    <div className="overflow-hidden rounded-xl border border-border">
      <div className="flex items-center gap-4 border-b border-border bg-muted/40 px-4 py-3">
        {Array.from({ length: colonnes }).map((_, index) => (
          <Skeleton key={index} className="h-4 flex-1" />
        ))}
      </div>

      {Array.from({ length: lignes }).map((_, ligne) => (
        <div
          key={ligne}
          className="flex items-center gap-4 border-b border-border px-4 py-4 last:border-b-0"
        >
          {Array.from({ length: colonnes }).map((_, colonne) => (
            <Skeleton
              key={colonne}
              className="h-4 flex-1"
              /*
                Largeurs inégales : une grille parfaitement régulière ne
                ressemble à aucun contenu réel et se lit comme un défaut
                d'affichage plutôt que comme une attente.
              */
              style={{ maxWidth: colonne === 0 ? undefined : "8rem" }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

/** Squelette de cartes — sous 768 px. */
function CardsSkeleton({ lignes }: { lignes: number }) {
  return (
    <div className="flex flex-col gap-2">
      {Array.from({ length: lignes }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-xl border border-border bg-card p-4"
        >
          <div className="flex items-center justify-between gap-3">
            <Skeleton className="h-4 w-2/3" />
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
          <Skeleton className="h-3 w-1/2" />
          <Skeleton className="h-3 w-1/3" />
        </div>
      ))}
    </div>
  );
}
