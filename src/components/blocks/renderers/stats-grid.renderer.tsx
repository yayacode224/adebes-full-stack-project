import { StatCard } from "@/components/cards/stat-card";
import { Reveal } from "@/components/ui-ext/reveal";
import type { StatsGridContent } from "@/core/cms/blocks/definitions/stats-grid.block";
import { cn } from "@/lib/utils";
import { getChiffresAffiches } from "@/server/queries/stats.query";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Grille de chiffres clés ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUN FILTRE SUR « CHIFFRE RENSEIGNÉ » — C'EST L'INVARIANT Nº 1
 * ---------------------------------------------------------------------------
 * `beneficiaires` porte `value = null` : sa carte affiche « — » et sa mention.
 * Elle RESTE dans la grille. Filtrer les chiffres non consolidés aurait été
 * plus joli et malhonnête — la carte disparue, plus rien ne dirait que
 * l'association suit cet indicateur sans pouvoir encore le chiffrer.
 *
 * C'est `<StatCard>` qui porte ce comportement depuis le Lot 8G ; ce rendu n'a
 * qu'à ne pas le contourner.
 *
 * ---------------------------------------------------------------------------
 * LA SECTION DISPARAÎT SI TOUS LES CHIFFRES SONT MASQUÉS
 * ---------------------------------------------------------------------------
 * Règle établie depuis le Lot 8B et déjà appliquée par l'accueil et `/impact`.
 * Elle ne se déclenche que si AUCUN chiffre n'est visible — un chiffre sans
 * valeur, lui, reste affiché.
 */
export async function StatsGridRenderer({
  content,
}: ProprietesDeRendu<StatsGridContent>) {
  const chiffres = await getChiffresAffiches();
  if (chiffres.length === 0) return null;

  return (
    <BlockSection
      id="chiffres"
      entete={content}
      espacement="page"
      fond="carte"
      bordure
    >
      <ul
        className={cn(
          "grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4",
          enteteEstVide(content) ? undefined : "mt-8",
        )}
      >
        {chiffres.map((chiffre, index) => (
          <Reveal as="li" key={chiffre.id} delay={index * 0.06}>
            {content.showNotes ? (
              <div className="flex h-full flex-col">
                <StatCard stat={chiffre} />
                {chiffre.note ? (
                  <p className="mt-2 px-1 text-xs leading-relaxed text-muted-foreground">
                    {chiffre.note}
                  </p>
                ) : null}
              </div>
            ) : (
              <StatCard stat={chiffre} className="h-full" />
            )}
          </Reveal>
        ))}
      </ul>
    </BlockSection>
  );
}
