import { z } from "zod";

import {
  DEFAUTS_ENTETE_ALIGNE,
  champLimite,
  champsEntete,
  enteteAligneShape,
  limiteSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TÉMOIGNAGES — `<TestimonialCard>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les témoignages en ligne, dans l'ordre de `/dashboard/temoignages`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA LIMITE PAR DÉFAUT EST 3, ET LA RAISON EST DANS LA GRILLE
 * ---------------------------------------------------------------------------
 * La grille est en `md:grid-cols-3` — sans multiple de trois, un quatrième
 * témoignage produit une ligne solitaire. C'est le raisonnement déjà écrit dans
 * l'accueil au Lot 8C, et il appartient désormais au bloc plutôt qu'à la page.
 *
 * La limite reste MODIFIABLE : six témoignages remplissent deux lignes, et rien
 * n'interdit d'assumer une ligne dépareillée. Ce que le bloc refuse, c'est de
 * décider seul.
 *
 * ---------------------------------------------------------------------------
 * LE CONSENTEMENT EST DÉJÀ TRANCHÉ, ET PAS ICI
 * ---------------------------------------------------------------------------
 * La règle du Lot 8C — un témoignage non consenti ne peut pas être publié —
 * vit dans le domaine des témoignages, pas dans ce bloc. Un `Renderer` qui
 * refiltrerait sur le consentement dupliquerait une garde déjà posée trois
 * couches plus bas, et laisserait croire qu'elle est facultative.
 */

const schema = z.object(
  {
    ...enteteAligneShape,
    limit: limiteSchema,
  },
  { message: "Contenu de bloc témoignages invalide." },
);

export type TestimonialsContent = z.infer<typeof schema>;

export const testimonialsBlock: BlockDefinition<typeof schema> = {
  type: "testimonials",
  label: "Témoignages",
  description:
    "Affiche les témoignages en ligne, dans l'ordre choisi dans « Témoignages ».",
  category: "mise-en-avant",
  collection: "Témoignages",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE_ALIGNE,
    limit: 3,
  },
  fields: [
    ...champsEntete(),
    champLimite(
      "Trois témoignages tiennent sur une ligne. Un quatrième se retrouve seul sur la ligne suivante.",
    ),
  ],
};
