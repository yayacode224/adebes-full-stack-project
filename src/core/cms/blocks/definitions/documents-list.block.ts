import { z } from "zod";

import {
  DEFAUTS_ENTETE,
  champsEntete,
  enteteShape,
  libelleLienSchema,
  lienSchema,
} from "../shared";
import type { BlockDefinition } from "../types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LISTE DE DOCUMENTS — les rapports annuels
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les rapports publiés, dans l'ordre de `/dashboard/documents`. Une seule
 * section du site l'emploie aujourd'hui : « Rapports d'activité » sur
 * `/impact`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UN RAPPORT SANS PDF RESTE AFFICHÉ, AVEC SA MENTION
 * ---------------------------------------------------------------------------
 * C'est la particularité tranchée au Lot 8I, et aucun réglage de ce bloc ne
 * permet de la contourner : `document_media_id` est NULLABLE, il n'y a donc
 * aucune garde de publication, et les deux rapports actuellement en base
 * (2025 et 2024) n'ont pas encore de fichier.
 *
 * La ligne affiche alors la pastille « Bientôt disponible » au lieu du bouton
 * de téléchargement. Filtrer les rapports sans fichier aurait vidé la section
 * entière et fait disparaître l'engagement de transparence en même temps que
 * les documents qui le tiennent.
 *
 * Le libellé de la mention et celui de la pastille vivent dans l'entité
 * `AnnualReport` (`MENTION_AVEC_DOCUMENT`, `MENTION_SANS_DOCUMENT`,
 * `PASTILLE_SANS_DOCUMENT`), pas ici : ils décrivent l'état d'un rapport, pas
 * un choix de mise en page.
 */

const schema = z.object(
  {
    ...enteteShape,
    footerText: z
      .string("Le texte de fin doit être du texte.")
      .trim()
      .max(200, "Ce texte est trop long (200 caractères maximum)."),
    footerLinkLabel: libelleLienSchema,
    footerHref: lienSchema,
  },
  { message: "Contenu de liste de documents invalide." },
);

export type DocumentsListContent = z.infer<typeof schema>;

export const documentsListBlock: BlockDefinition<typeof schema> = {
  type: "documents-list",
  label: "Liste de documents",
  description:
    "Affiche les rapports publiés, avec leur bouton de téléchargement. Un rapport sans fichier reste listé, signalé comme à venir.",
  category: "contenu",
  collection: "Documents",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE,
    footerText: "",
    footerLinkLabel: "",
    footerHref: "",
  },
  fields: [
    ...champsEntete({ sansAlignement: true }),
    {
      kind: "text",
      name: "footerText",
      label: "Phrase de fin",
      maxLength: 200,
      hint: "Affichée sous la liste. Laissez vide pour ne rien afficher.",
      placeholder: "Vous souhaitez le détail de l'utilisation d'un don ?",
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
