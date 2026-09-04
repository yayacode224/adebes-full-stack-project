import { z } from "zod";

import {
  DEFAUTS_ENTETE,
  champLimite,
  champsEntete,
  enteteShape,
  libelleLienSchema,
  lienSchema,
  limiteSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GRILLE DE PROGRAMMES — `<ProgrammeCard>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les programmes publiés, dans l'ordre de `/dashboard/programmes`. Deux
 * appelants aux besoins opposés, et c'est ce qui motive `limit` :
 *
 *   * l'accueil en montre **six** (grille `lg:grid-cols-3`, deux lignes
 *     pleines) et renvoie vers la page de liste ;
 *   * `/programmes` les montre **tous** et n'a nulle part où renvoyer.
 *
 * `limit = null` signifie « tous » — voir l'avertissement de `limiteSchema`
 * dans `shared.ts` : c'est la valeur PLEINE, pas la valeur vide.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE LIEN « VOIR TOUT » N'EST PAS DÉDUIT DE LA LIMITE
 * ---------------------------------------------------------------------------
 * Il aurait été tentant de l'afficher automatiquement dès que `limit` est posée.
 * Ce serait faux dans les deux sens : une grille limitée à trois programmes sur
 * une page thématique n'appelle pas forcément la liste complète, et une grille
 * complète peut vouloir renvoyer ailleurs. Le libellé vide masque le bouton,
 * comme partout ailleurs dans ce registre.
 */

const schema = z.object(
  {
    ...enteteShape,
    limit: limiteSchema,
    ctaLabel: libelleLienSchema,
    ctaHref: lienSchema,
  },
  { message: "Contenu de grille de programmes invalide." },
);

export type ProgrammesGridContent = z.infer<typeof schema>;

export const programmesGridBlock: BlockDefinition<typeof schema> = {
  type: "programmes-grid",
  label: "Grille de programmes",
  description:
    "Affiche les programmes publiés, dans l'ordre choisi dans « Programmes ». Chaque carte mène à la page du programme.",
  category: "mise-en-avant",
  collection: "Programmes",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE,
    limit: null,
    ctaLabel: "",
    ctaHref: "",
  },
  fields: [
    ...champsEntete({ sansAlignement: true }),
    champLimite(
      "Cochez « pas de limite » pour afficher tous les programmes publiés. La grille tient trois cartes par ligne sur grand écran.",
    ),
    {
      kind: "text",
      name: "ctaLabel",
      label: "Libellé du lien « voir tout »",
      maxLength: 60,
      hint: "Laissez vide pour ne pas afficher de lien.",
      placeholder: "Voir les 8 programmes",
    },
    {
      kind: "link",
      name: "ctaHref",
      label: "Lien « voir tout »",
      hint: "En général /programmes.",
    },
  ],
};
