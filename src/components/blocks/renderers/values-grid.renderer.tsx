import { ValueCard } from "@/components/cards/value-card";
import { Reveal } from "@/components/ui-ext/reveal";
import type { ValuesGridContent } from "@/core/cms/blocks/definitions/values-grid.block";
import { cn } from "@/lib/utils";
import { getValeursAffichees } from "@/server/queries/values.query";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Grille de valeurs ».
 *
 * Aucune coupe : la grille est en `lg:grid-cols-4` et absorbe un nombre
 * quelconque de cartes — c'est le raisonnement du Lot 8E, et il n'y a pas de
 * ligne solitaire à redouter comme pour les témoignages.
 *
 * ⚠️  `id="valeurs"` : l'ancre visée par « Voir sur le site » depuis
 * `/dashboard/valeurs`. Sans elle, le lien mènerait en haut de page et
 * laisserait chercher la section.
 */
export async function ValuesGridRenderer({
  content,
}: ProprietesDeRendu<ValuesGridContent>) {
  const valeurs = await getValeursAffichees();
  if (valeurs.length === 0) return null;

  return (
    <BlockSection id="valeurs" entete={content} espacement="page" fond="carte">
      <ul
        className={cn(
          "grid gap-4 sm:grid-cols-2 lg:grid-cols-4",
          enteteEstVide(content) ? undefined : "mt-10",
        )}
      >
        {valeurs.map((valeur, index) => (
          <Reveal as="li" key={valeur.id} delay={index * 0.06}>
            <ValueCard valeur={valeur} className="h-full" />
          </Reveal>
        ))}
      </ul>
    </BlockSection>
  );
}
