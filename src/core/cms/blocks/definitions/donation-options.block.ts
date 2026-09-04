import { z } from "zod";

import { ICON_NAMES } from "../../entities/icon-name";
import {
  DEFAUTS_ENTETE_ALIGNE,
  champFond,
  champsEntete,
  enteteAligneShape,
  fondSchema,
  libelleLienSchema,
  lienSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MOYENS DE DON
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Deux sections de `/don` réunies : le sélecteur de montants avec son bouton
 * WhatsApp, et la grille des moyens de paiement complémentaires.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `status` EST CE QUI REND CE BLOC HONNÊTE
 * ---------------------------------------------------------------------------
 * Les trois moyens actuels portent une mention d'état — « Coordonnées
 * communiquées sur demande », « Bientôt disponible ». Ce n'est pas de la
 * décoration : le site n'a **aucun** moyen de paiement en ligne opérationnel,
 * et le §1 du Rapport 1 interdit d'en laisser croire un.
 *
 * Un moyen sans mention se lit comme un moyen disponible. Le champ est donc
 * proposé sur chaque entrée, et son aide le dit — c'est la seule façon de
 * décrire « on l'accepte, mais écrivez-nous d'abord » sans mentir dans un sens
 * ni dans l'autre.
 *
 * ---------------------------------------------------------------------------
 * LES MONTANTS SUGGÉRÉS NE SONT PAS ÉDITABLES DEPUIS CE BLOC
 * ---------------------------------------------------------------------------
 * `<DonationAmounts>` porte ses quatre paliers et compose son message WhatsApp
 * en francs CFA. Les rendre éditables ici aurait été une fausse bonne idée :
 * ils sont indissociables du format monétaire et du texte du message, qui vit
 * dans le même composant. Le bloc décide de l'AFFICHER ou non ; son contenu
 * relève des réglages de don, prévus au Lot 10.
 */

const moyenSchema = z.object(
  {
    icon: z.enum(ICON_NAMES, { message: "Choisissez une icône dans la liste." }),
    title: z
      .string("Le nom du moyen est obligatoire.")
      .trim()
      .min(2, "Le nom du moyen est obligatoire.")
      .max(60, "Ce nom est trop long (60 caractères maximum)."),
    description: z
      .string("L'explication doit être du texte.")
      .trim()
      .max(200, "Cette explication est trop longue (200 caractères maximum)."),
    /** Mention d'état. Voir l'avertissement en tête de fichier. */
    status: z
      .string("La mention doit être du texte.")
      .trim()
      .max(80, "Cette mention est trop longue (80 caractères maximum)."),
  },
  { message: "Moyen de don invalide." },
);

const schema = z.object(
  {
    ...enteteAligneShape,
    /** Affiche le sélecteur de montants et son bouton WhatsApp. */
    showAmounts: z.boolean("Choix invalide."),
    background: fondSchema,
    methods: z
      .array(moyenSchema, { message: "La liste des moyens est invalide." })
      .max(8, "Huit moyens au maximum."),
    footerText: z
      .string("Le texte de fin doit être du texte.")
      .trim()
      .max(200, "Ce texte est trop long (200 caractères maximum)."),
    footerLinkLabel: libelleLienSchema,
    footerHref: lienSchema,
  },
  { message: "Contenu de bloc moyens de don invalide." },
);

export type DonationOptionsContent = z.infer<typeof schema>;

export const donationOptionsBlock: BlockDefinition<typeof schema> = {
  type: "donation-options",
  label: "Moyens de don",
  description:
    "Le sélecteur de montants avec son bouton WhatsApp, et la liste des autres moyens de donner.",
  category: "conversion",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE_ALIGNE,
    showAmounts: true,
    background: "default",
    methods: [],
    footerText: "",
    footerLinkLabel: "",
    footerHref: "",
  },
  fields: [
    ...champsEntete(),
    {
      kind: "boolean",
      name: "showAmounts",
      label: "Afficher le sélecteur de montants",
      hint: "Quatre montants suggérés, un montant libre, et un bouton qui ouvre WhatsApp avec le message déjà écrit.",
    },
    champFond(),
    {
      kind: "list",
      name: "methods",
      label: "Autres moyens de donner",
      itemLabel: "moyen",
      max: 8,
      of: [
        { kind: "icon", name: "icon", label: "Icône", required: true },
        {
          kind: "text",
          name: "title",
          label: "Nom du moyen",
          required: true,
          maxLength: 60,
          placeholder: "Mobile Money",
        },
        {
          kind: "text",
          name: "description",
          label: "Explication",
          maxLength: 200,
          placeholder: "Orange Money et MTN Mobile Money.",
        },
        {
          kind: "text",
          name: "status",
          label: "Mention d'état",
          maxLength: 80,
          hint: "Dites franchement où en est ce moyen : « Coordonnées communiquées sur demande », « Bientôt disponible ». Sans mention, il se lit comme immédiatement utilisable.",
        },
      ],
    },
    {
      kind: "text",
      name: "footerText",
      label: "Phrase de fin",
      maxLength: 200,
      hint: "Affichée sous la liste. Laissez vide pour ne rien afficher.",
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
      hint: "Une adresse e-mail se saisit sous la forme mailto:contact@exemple.org.",
    },
  ],
};
