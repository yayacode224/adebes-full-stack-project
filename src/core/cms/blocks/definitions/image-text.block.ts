import { z } from "zod";

import {
  DEFAUTS_ENTETE,
  champListeDeTextes,
  champsEntete,
  enteteShape,
  libelleLienSchema,
  lienSchema,
  mediaIdSchema,
  paragraphesSchema,
  pucesSchema,
  teinteSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  IMAGE + TEXTE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deux colonnes à partir de `lg:` — un visuel d'un côté, un en-tête de section
 * et du texte de l'autre. C'est la section « Qui sommes-nous » de l'accueil, la
 * section « Notre mission » de `/a-propos` et l'ouverture de `/biographie`.
 *
 * ---------------------------------------------------------------------------
 * `imageSide` DÉCRIT LE BUREAU, PAS LE TÉLÉPHONE
 * ---------------------------------------------------------------------------
 * Sous `lg:`, les deux colonnes s'empilent et l'image passe TOUJOURS en
 * premier — c'est ce que font déjà les deux sections existantes, et c'est le
 * bon ordre : l'image situe le propos avant qu'on ne le lise. Le réglage n'a
 * donc d'effet qu'à partir de 1024 px, ce que l'aide du champ dit.
 *
 * ---------------------------------------------------------------------------
 * TROIS FORMES DE TEXTE, ET ELLES SE CUMULENT
 * ---------------------------------------------------------------------------
 * Sous-titre, paragraphes, puces. L'accueil n'emploie que le sous-titre et les
 * puces ; `/a-propos` n'emploie que les paragraphes. Aucune n'est obligatoire,
 * et un bloc qui n'en emploie aucune rend son titre seul — ce qui est un état
 * légitime pendant la rédaction.
 */

const schema = z.object(
  {
    ...enteteShape,
    paragraphs: paragraphesSchema,
    bullets: pucesSchema,
    mediaId: mediaIdSchema,
    tone: teinteSchema,
    /** Côté de l'image à partir de 1024 px. Sans effet en dessous. */
    imageSide: z.enum(["left", "right"], {
      message: "Choisissez le côté de l'image.",
    }),
    ctaLabel: libelleLienSchema,
    ctaHref: lienSchema,
  },
  { message: "Contenu du bloc image + texte invalide." },
);

export type ImageTextContent = z.infer<typeof schema>;

export const imageTextBlock: BlockDefinition<typeof schema> = {
  type: "image-text",
  label: "Image + texte",
  description:
    "Un visuel d'un côté, un texte de l'autre. Sur téléphone, l'image passe au-dessus du texte.",
  category: "contenu",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE,
    paragraphs: [],
    bullets: [],
    mediaId: null,
    tone: "blue",
    imageSide: "left",
    ctaLabel: "",
    ctaHref: "",
  },
  fields: [
    ...champsEntete({ sansAlignement: true }),
    {
      kind: "media",
      name: "mediaId",
      label: "Image",
      accept: "image",
      hint: "Sans image, un aplat coloré occupe la place — la mise en page ne bouge pas.",
    },
    {
      kind: "tone",
      name: "tone",
      label: "Teinte de l'aplat",
      required: true,
    },
    {
      kind: "select",
      name: "imageSide",
      label: "Côté de l'image",
      options: [
        { value: "left", label: "À gauche du texte" },
        { value: "right", label: "À droite du texte" },
      ],
      required: true,
      hint: "Sur téléphone et tablette, l'image reste toujours au-dessus du texte.",
    },
    {
      kind: "richtext",
      name: "paragraphs",
      label: "Paragraphes",
    },
    champListeDeTextes("bullets", "Puces", "puce", {
      max: 12,
      hint: "Une liste à points sous le texte. Laissez vide pour ne pas l'afficher.",
    }),
    {
      kind: "text",
      name: "ctaLabel",
      label: "Libellé du bouton",
      maxLength: 60,
      hint: "Laissez vide pour ne pas afficher de bouton.",
    },
    {
      kind: "link",
      name: "ctaHref",
      label: "Lien du bouton",
    },
  ],
};
