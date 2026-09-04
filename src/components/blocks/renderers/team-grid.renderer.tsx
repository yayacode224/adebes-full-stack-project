import { TeamMemberCard } from "@/components/cards/team-member-card";
import { Reveal } from "@/components/ui-ext/reveal";
import type { TeamGridContent } from "@/core/cms/blocks/definitions/team-grid.block";
import { cn } from "@/lib/utils";
import { resoudreMedias } from "@/server/queries/media.query";
import { getMembresEquipePublies } from "@/server/queries/team.query";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Équipe ».
 *
 * ⚠️  CETTE SECTION EST AUJOURD'HUI VIDE SUR LE SITE, ET CE N'EST PAS UNE
 * PANNE. Les trois fiches du seed sont en brouillon : elles portent des
 * `[À COMPLÉTER]` repris tels quels du contenu d'origine, et la garde du
 * Lot 8D refuse de publier une fiche qui en contient encore.
 *
 * ⚠️  `id="equipe"` : l'ancre visée par « Voir sur le site » depuis
 * `/dashboard/equipe`.
 */
export async function TeamGridRenderer({
  content,
}: ProprietesDeRendu<TeamGridContent>) {
  const membres = await getMembresEquipePublies();
  if (membres.length === 0) return null;

  const portraits = await resoudreMedias(
    membres.map((membre) => membre.photoMediaId),
  );

  return (
    <BlockSection id="equipe" entete={content} espacement="page">
      <ul
        className={cn(
          "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
          enteteEstVide(content) ? undefined : "mt-8",
        )}
      >
        {membres.map((membre, index) => (
          <Reveal as="li" key={membre.id} delay={index * 0.06}>
            <TeamMemberCard
              membre={membre}
              photo={
                membre.photoMediaId ? portraits.get(membre.photoMediaId) : null
              }
            />
          </Reveal>
        ))}
      </ul>
    </BlockSection>
  );
}
