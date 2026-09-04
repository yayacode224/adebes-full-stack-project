import { z } from "zod";

import { sousTitreSchema, titreSchema } from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  BANNIÈRE D'APPEL À L'ACTION — `<CTABanner>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Le pavé bleu nuit qui ferme sept des dix pages éditoriales : « Faire un
 * don » · « Devenir bénévole » · « WhatsApp ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LES TROIS BOUTONS NE SONT PAS PARAMÉTRABLES, ET C'EST LE CŒUR DU BLOC
 * ---------------------------------------------------------------------------
 * Seuls le titre et le sous-titre changent d'une page à l'autre — les sept
 * appels existants le prouvent. Rendre les destinations éditables aurait ouvert
 * la porte à une bannière qui ne mène nulle part, sur le composant dont la
 * fonction unique est de mener quelque part.
 *
 * Le lien WhatsApp est composé par `whatsappLink()` à partir du numéro des
 * réglages du site (Lot 10). Ce bloc n'en choisit que le MESSAGE pré-rempli,
 * parce que celui-ci dépend de la page — « je viens de la page Bénévolat » n'a
 * pas le même sens que « je viens de la page Don ».
 *
 * ---------------------------------------------------------------------------
 * PAS D'EN-TÊTE DE SECTION
 * ---------------------------------------------------------------------------
 * Ni badge, ni alignement : `<CTABanner>` rend son propre titre centré, en
 * blanc sur fond sombre. Réutiliser `enteteShape` aurait exposé deux champs
 * sans effet, et un champ sans effet dans un formulaire est un piège.
 */

const schema = z.object(
  {
    title: titreSchema,
    subtitle: sousTitreSchema,
    /** Message pré-rempli du bouton WhatsApp. Vide = message de contact par défaut. */
    whatsappMessage: z
      .string("Le message doit être du texte.")
      .trim()
      .max(300, "Ce message est trop long (300 caractères maximum)."),
  },
  { message: "Contenu de bannière invalide." },
);

export type CtaBannerContent = z.infer<typeof schema>;

export const ctaBannerBlock: BlockDefinition<typeof schema> = {
  type: "cta-banner",
  label: "Bannière d'appel à l'action",
  description:
    "Le pavé de fin de page, avec ses trois boutons : don, bénévolat et WhatsApp. Seul le texte se modifie.",
  category: "conversion",
  schema,
  defaults: {
    title: "",
    subtitle: "",
    whatsappMessage: "",
  },
  fields: [
    {
      kind: "text",
      name: "title",
      label: "Titre",
      maxLength: 120,
      hint: "Laissez vide pour garder le titre par défaut : « Votre soutien change des vies ».",
    },
    {
      kind: "textarea",
      name: "subtitle",
      label: "Sous-titre",
      maxLength: 300,
      rows: 3,
      hint: "Laissez vide pour garder le texte par défaut.",
    },
    {
      kind: "textarea",
      name: "whatsappMessage",
      label: "Message WhatsApp pré-rempli",
      maxLength: 300,
      rows: 2,
      hint: "Ce que le visiteur verra déjà écrit en ouvrant la conversation. Laissez vide pour le message de contact habituel.",
    },
  ],
};
