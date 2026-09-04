import { z } from "zod";

import { DEFAUTS_ENTETE, champsEntete, enteteShape } from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  COORDONNÉES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Adresse, téléphone, e-mail, horaires, réseaux sociaux et bouton WhatsApp —
 * la colonne de droite de `/contact`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE BLOC NE STOCKE AUCUNE COORDONNÉE, ET C'EST TOUT SON INTÉRÊT
 * ---------------------------------------------------------------------------
 * Les valeurs viennent du groupe de réglages `contact` (aujourd'hui
 * `src/lib/site-config.ts`, demain `site_settings` au Lot 10). Elles sont
 * affichées à cinq endroits du site : ce bloc, le pied de page, l'en-tête
 * mobile, la barre d'action collante et le balisage `NGO`.
 *
 * Les recopier dans le contenu d'une section aurait créé une sixième source de
 * vérité — celle qu'on oublie de mettre à jour le jour où le numéro change, et
 * qui affiche alors un téléphone mort sur la page Contact. C'est précisément
 * l'invariant nº 2 (aucun lien mort) pris à revers.
 *
 * Les champs de ce bloc ne décident donc que de ce qu'on MONTRE. Une
 * coordonnée non renseignée dans les réglages n'est jamais affichée, même si sa
 * case est cochée : le `Renderer` ne rend pas une ligne « Téléphone : ».
 */

const schema = z.object(
  {
    ...enteteShape,
    showAddress: z.boolean("Choix invalide."),
    showPhone: z.boolean("Choix invalide."),
    showEmail: z.boolean("Choix invalide."),
    showHours: z.boolean("Choix invalide."),
    showSocial: z.boolean("Choix invalide."),
    showWhatsApp: z.boolean("Choix invalide."),
  },
  { message: "Contenu de bloc coordonnées invalide." },
);

export type ContactInfoContent = z.infer<typeof schema>;

export const contactInfoBlock: BlockDefinition<typeof schema> = {
  type: "contact-info",
  label: "Coordonnées",
  description:
    "Adresse, téléphone, e-mail et horaires, repris des réglages du site. Modifier une coordonnée se fait dans « Réglages », pas ici.",
  category: "conversion",
  collection: "Réglages",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE,
    showAddress: true,
    showPhone: true,
    showEmail: true,
    showHours: true,
    showSocial: true,
    showWhatsApp: true,
  },
  fields: [
    ...champsEntete({ sansAlignement: true }),
    { kind: "boolean", name: "showAddress", label: "Afficher l'adresse" },
    { kind: "boolean", name: "showPhone", label: "Afficher le téléphone" },
    { kind: "boolean", name: "showEmail", label: "Afficher l'e-mail" },
    { kind: "boolean", name: "showHours", label: "Afficher les horaires" },
    {
      kind: "boolean",
      name: "showSocial",
      label: "Afficher les réseaux sociaux",
      hint: "Un réseau non renseigné dans les réglages n'est pas affiché.",
    },
    {
      kind: "boolean",
      name: "showWhatsApp",
      label: "Afficher le bouton WhatsApp",
    },
  ],
};
