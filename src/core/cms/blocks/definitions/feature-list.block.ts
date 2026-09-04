import { z } from "zod";

import { ICON_NAMES } from "../../entities/icon-name";
import {
  DEFAUTS_ENTETE_ALIGNE,
  champsEntete,
  enteteAligneShape,
  libelleLienSchema,
  lienSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LISTE À PUCES ILLUSTRÉE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Une grille de cartes « icône + titre + explication ». C'est le bloc le plus
 * réemployé de la migration : il couvre les quatre engagements de `/impact`,
 * les trois zones d'intervention de la même page, les domaines d'engagement de
 * `/benevolat`, les domaines de compétence de `/biographie` et la gouvernance
 * de `/a-propos`.
 *
 * Ces cinq sections étaient écrites en clair dans cinq fichiers `.tsx`, avec
 * cinq mises en page très proches mais jamais identiques. Les réunir est
 * exactement ce que le §9.1 attend d'un registre de blocs — et c'est aussi ce
 * qui rend l'écart le plus visible : deux d'entre elles vont changer très
 * légèrement d'apparence. La recette du lot le mesure section par section.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `icon` EST VALIDÉ PAR ÉNUMÉRATION
 * ---------------------------------------------------------------------------
 * `z.enum(ICON_NAMES)`, et non `z.string().min(1)`. C'est l'acquis du Lot 8E :
 * une chaîne libre laisse écrire `icon: "bonjour"` par un POST direct, la page
 * rend l'étoile de repli, et rien ne signale que la donnée est fausse. Le
 * contenu d'un bloc est du JSONB — encore plus exposé qu'une colonne typée.
 */

const elementSchema = z.object(
  {
    icon: z.enum(ICON_NAMES, { message: "Choisissez une icône dans la liste." }),
    title: z
      .string("Le titre est obligatoire.")
      .trim()
      .min(2, "Le titre est obligatoire.")
      .max(80, "Ce titre est trop long (80 caractères maximum)."),
    description: z
      .string("L'explication doit être du texte.")
      .trim()
      .max(300, "Cette explication est trop longue (300 caractères maximum)."),
  },
  { message: "Élément de liste invalide." },
);

const schema = z.object(
  {
    ...enteteAligneShape,
    items: z
      .array(elementSchema, { message: "La liste des éléments est invalide." })
      .max(12, "Douze éléments au maximum."),
    /** Nombre de colonnes à partir de `sm:`. En dessous, toujours une seule. */
    columns: z.enum(["2", "3"], { message: "Choisissez un nombre de colonnes." }),
    /** Cartes centrées (zones d'intervention) plutôt qu'icône à gauche du texte. */
    centered: z.boolean("Choix invalide."),
    footerText: z
      .string("Le texte de fin doit être du texte.")
      .trim()
      .max(200, "Ce texte est trop long (200 caractères maximum)."),
    footerLinkLabel: libelleLienSchema,
    footerHref: lienSchema,
  },
  { message: "Contenu de liste illustrée invalide." },
);

export type FeatureListContent = z.infer<typeof schema>;

export const featureListBlock: BlockDefinition<typeof schema> = {
  type: "feature-list",
  label: "Liste à puces illustrée",
  description:
    "Une grille de cartes « icône + titre + explication ». Pour des engagements, des domaines d'action, des zones d'intervention.",
  category: "contenu",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE_ALIGNE,
    align: "center",
    items: [],
    columns: "2",
    centered: false,
    footerText: "",
    footerLinkLabel: "",
    footerHref: "",
  },
  fields: [
    ...champsEntete(),
    {
      kind: "list",
      name: "items",
      label: "Éléments",
      itemLabel: "élément",
      required: true,
      max: 12,
      of: [
        { kind: "icon", name: "icon", label: "Icône", required: true },
        { kind: "text", name: "title", label: "Titre", required: true, maxLength: 80 },
        {
          kind: "textarea",
          name: "description",
          label: "Explication",
          maxLength: 300,
          rows: 3,
        },
      ],
    },
    {
      kind: "select",
      name: "columns",
      label: "Colonnes",
      options: [
        { value: "2", label: "Deux colonnes" },
        { value: "3", label: "Trois colonnes" },
      ],
      required: true,
      hint: "Sur téléphone, les cartes s'empilent toujours sur une seule colonne.",
    },
    {
      kind: "boolean",
      name: "centered",
      label: "Cartes centrées",
      hint: "L'icône passe au-dessus du titre plutôt qu'à sa gauche. Convient aux listes courtes.",
    },
    {
      kind: "text",
      name: "footerText",
      label: "Phrase de fin",
      maxLength: 200,
      hint: "Affichée sous la grille. Laissez vide pour ne rien afficher.",
    },
    {
      kind: "text",
      name: "footerLinkLabel",
      label: "Libellé du lien de fin",
      maxLength: 60,
    },
    {
      kind: "link",
      name: "footerHref",
      label: "Lien de fin",
    },
  ],
};
