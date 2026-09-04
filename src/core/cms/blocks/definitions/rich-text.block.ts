import { z } from "zod";

import {
  DEFAUTS_ENTETE_ALIGNE,
  champsEntete,
  enteteAligneShape,
  paragraphesSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  TEXTE LIBRE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le bloc de repli : un en-tête de section et des paragraphes. Il alimente la
 * section « Gouvernance » de `/a-propos`, « Autres moyens de donner » de `/don`
 * et les deux sections de fin de `/biographie`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  PAS DE HTML, ET CE N'EST PAS UNE LIMITATION PROVISOIRE
 * ---------------------------------------------------------------------------
 * Le §6.2 fixe la v1 du champ `richtext` : « une ligne par paragraphe, stockée
 * en `string[]` ». Le `Renderer` rend un `<p>` par entrée. Aucun
 * `dangerouslySetInnerHTML` n'existe dans ce projet et il n'en apparaîtra pas
 * ici : un éditeur de contenu qui accepte du HTML accepte du `<script>`, et la
 * seule barrière serait alors un assainisseur à jour — une dette permanente
 * pour un gain que le contenu réel du site ne réclame nulle part.
 *
 * Le jour où un gras ou un lien dans le fil du texte deviendra nécessaire, la
 * réponse sera un format balisé restreint, pas du HTML libre.
 */

const schema = z.object(
  {
    ...enteteAligneShape,
    paragraphs: paragraphesSchema,
    /** Largeur du texte : `narrow` (max-w-3xl) rend la lecture plus confortable. */
    width: z.enum(["narrow", "default", "wide"], {
      message: "Choisissez une largeur.",
    }),
  },
  { message: "Contenu de texte libre invalide." },
);

export type RichTextContent = z.infer<typeof schema>;

export const richTextBlock: BlockDefinition<typeof schema> = {
  type: "rich-text",
  label: "Texte libre",
  description:
    "Un titre de section et des paragraphes que vous rédigez. Le bloc à utiliser quand aucun autre ne convient.",
  category: "contenu",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE_ALIGNE,
    paragraphs: [],
    width: "default",
  },
  fields: [
    ...champsEntete(),
    {
      kind: "richtext",
      name: "paragraphs",
      label: "Texte",
      required: true,
    },
    {
      kind: "select",
      name: "width",
      label: "Largeur du texte",
      options: [
        { value: "narrow", label: "Étroite — plus confortable à lire" },
        { value: "default", label: "Normale" },
        { value: "wide", label: "Large" },
      ],
      required: true,
      hint: "Une colonne étroite se lit mieux qu'une ligne qui traverse tout l'écran.",
    },
  ],
};
