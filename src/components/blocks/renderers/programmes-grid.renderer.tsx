import { ArrowRight } from "lucide-react";
import Link from "next/link";

import { ProgrammeCard } from "@/components/cards/programme-card";
import { Button } from "@/components/ui/button";
import { Reveal } from "@/components/ui-ext/reveal";
import type { ProgrammesGridContent } from "@/core/cms/blocks/definitions/programmes-grid.block";
import { cn } from "@/lib/utils";
import { resoudreMedias } from "@/server/queries/media.query";
import { getProgrammesPublies } from "@/server/queries/programmes.query";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Grille de programmes ».
 *
 * ⚠️  Les couvertures sont résolues EN AMONT, en une seule requête. Une carte
 * qui va chercher son média produirait une requête par carte — six sur
 * l'accueil. C'est le contrat de `<ProgrammeCard>` depuis le Lot 8A, et il
 * remonte ici parce que c'est le bloc qui connaît la liste.
 */
export async function ProgrammesGridRenderer({
  content,
}: ProprietesDeRendu<ProgrammesGridContent>) {
  const tous = await getProgrammesPublies();
  const programmes = content.limit === null ? tous : tous.slice(0, content.limit);

  if (programmes.length === 0) return null;

  const couvertures = await resoudreMedias(
    programmes.map((programme) => programme.coverMediaId),
  );

  return (
    <BlockSection
      entete={content}
      espacement="page"
      action={
        content.ctaLabel && content.ctaHref ? (
          <Button asChild variant="outline">
            <Link href={content.ctaHref}>
              {content.ctaLabel}
              <ArrowRight className="size-4" aria-hidden="true" />
            </Link>
          </Button>
        ) : undefined
      }
    >
      <ul
        className={cn(
          "grid gap-5 sm:grid-cols-2 lg:grid-cols-3",
          enteteEstVide(content) ? undefined : "mt-10",
        )}
      >
        {programmes.map((programme, index) => (
          <Reveal as="li" key={programme.slug} delay={index * 0.05}>
            <ProgrammeCard
              programme={programme}
              cover={
                programme.coverMediaId
                  ? couvertures.get(programme.coverMediaId)
                  : null
              }
            />
          </Reveal>
        ))}
      </ul>
    </BlockSection>
  );
}
