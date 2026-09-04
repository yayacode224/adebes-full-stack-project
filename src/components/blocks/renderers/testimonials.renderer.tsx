import { TestimonialCard } from "@/components/cards/testimonial-card";
import { Reveal } from "@/components/ui-ext/reveal";
import type { TestimonialsContent } from "@/core/cms/blocks/definitions/testimonials.block";
import { cn } from "@/lib/utils";
import { resoudreMedias } from "@/server/queries/media.query";
import { getTemoignagesPublies } from "@/server/queries/testimonials.query";

import { BlockSection, enteteEstVide } from "../block-section";
import type { ProprietesDeRendu } from "../types";

/**
 * Rendu du bloc « Témoignages ».
 *
 * ⚠️  Aucun filtre sur le consentement : la règle du Lot 8C — un témoignage
 * non consenti ne peut pas être publié — vit dans le domaine, trois couches
 * plus bas. La refaire ici laisserait croire qu'elle est facultative.
 */
export async function TestimonialsRenderer({
  content,
}: ProprietesDeRendu<TestimonialsContent>) {
  const tous = await getTemoignagesPublies();
  const temoignages = content.limit === null ? tous : tous.slice(0, content.limit);

  if (temoignages.length === 0) return null;

  const portraits = await resoudreMedias(
    temoignages.map((temoignage) => temoignage.photoMediaId),
  );

  return (
    <BlockSection entete={content} espacement="page" fond="carte">
      <ul
        className={cn(
          "grid gap-5 md:grid-cols-3",
          enteteEstVide(content) ? undefined : "mt-10",
        )}
      >
        {temoignages.map((temoignage, index) => (
          <Reveal as="li" key={temoignage.id} delay={index * 0.06}>
            <TestimonialCard
              temoignage={temoignage}
              photo={
                temoignage.photoMediaId
                  ? portraits.get(temoignage.photoMediaId)
                  : null
              }
              className="h-full"
            />
          </Reveal>
        ))}
      </ul>
    </BlockSection>
  );
}
