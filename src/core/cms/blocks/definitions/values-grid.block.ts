import { z } from "zod";

import { DEFAUTS_ENTETE_ALIGNE, champsEntete, enteteAligneShape } from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GRILLE DE VALEURS — `<ValueCard>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les valeurs affichées (`is_visible`), dans l'ordre de `/dashboard/valeurs`.
 * Aucune limite : la grille est en `lg:grid-cols-4` et absorbe un nombre
 * quelconque de cartes — c'est le raisonnement déjà tenu au Lot 8E, et il n'y a
 * pas de ligne solitaire à redouter comme pour les témoignages.
 *
 * ⚠️  Ce bloc apparaît sur DEUX pages — l'accueil et « Qui sommes-nous ». Il
 * n'y a plus rien de particulier à en dire depuis le Lot 8E : les deux pages
 * lisent la même requête, et `values.actions.ts` invalide déjà les deux
 * étiquettes de page.
 */

const schema = z.object(
  { ...enteteAligneShape },
  { message: "Contenu de grille de valeurs invalide." },
);

export type ValuesGridContent = z.infer<typeof schema>;

export const valuesGridBlock: BlockDefinition<typeof schema> = {
  type: "values-grid",
  label: "Grille de valeurs",
  description:
    "Affiche les valeurs de l'association marquées comme visibles, dans l'ordre choisi dans « Valeurs ».",
  category: "mise-en-avant",
  collection: "Valeurs",
  schema,
  defaults: { ...DEFAUTS_ENTETE_ALIGNE },
  fields: champsEntete(),
};
