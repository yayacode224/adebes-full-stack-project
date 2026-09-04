import { z } from "zod";

import { DEFAUTS_ENTETE_ALIGNE, champsEntete, enteteAligneShape } from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  GRILLE DE CHIFFRES CLÉS — `<StatCard>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Premier des six blocs de collection : il n'a **aucun contenu propre** en
 * dehors de son en-tête. Les chiffres viennent de `/dashboard/chiffres`, dans
 * l'ordre et la visibilité qui y sont fixés.
 *
 * C'est ce que le drapeau `collection` sert à dire à l'écran. Sans lui, une
 * personne devant une section vide n'a qu'une conclusion possible — « le bloc
 * est cassé » — alors que la réponse est « aucun chiffre n'est affiché ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `showNotes` EST LA SEULE DIFFÉRENCE ENTRE L'ACCUEIL ET `/impact`
 * ---------------------------------------------------------------------------
 * Les deux pages rendent la même grille des mêmes chiffres. `/impact` ajoute
 * sous chaque carte la PRÉCISION du chiffre (`stat.note`) — « Chiffre consolidé
 * au 31/12/2024 », « En attente de consolidation ». L'accueil ne l'affiche pas.
 *
 * Sans ce réglage, migrer les deux pages aurait demandé deux blocs distincts
 * pour une différence d'une ligne de rendu. Et le supprimer au profit d'un
 * affichage systématique aurait alourdi l'accueil de quatre mentions de source
 * là où la promesse est un coup d'œil.
 *
 * ⚠️  Un chiffre sans valeur RESTE affiché, avec « — ». C'est l'invariant nº 1
 * du projet, tranché au Lot 8G : filtrer les chiffres non consolidés aurait été
 * plus joli et malhonnête. Aucun réglage de ce bloc ne permet de les masquer,
 * et c'est délibéré.
 */

const schema = z.object(
  {
    ...enteteAligneShape,
    /** Affiche `stat.note` sous chaque carte — la source du chiffre. */
    showNotes: z.boolean("Choix invalide."),
  },
  { message: "Contenu de grille de chiffres invalide." },
);

export type StatsGridContent = z.infer<typeof schema>;

export const statsGridBlock: BlockDefinition<typeof schema> = {
  type: "stats-grid",
  label: "Grille de chiffres clés",
  description:
    "Affiche les chiffres clés marqués comme visibles, dans l'ordre choisi dans « Chiffres clés ».",
  category: "mise-en-avant",
  collection: "Chiffres clés",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE_ALIGNE,
    showNotes: false,
  },
  fields: [
    ...champsEntete(),
    {
      kind: "boolean",
      name: "showNotes",
      label: "Afficher la source de chaque chiffre",
      hint: "La précision saisie avec le chiffre (« Chiffre consolidé au… ») apparaît sous la carte. Recommandé sur une page de transparence, superflu sur l'accueil.",
    },
  ],
};
