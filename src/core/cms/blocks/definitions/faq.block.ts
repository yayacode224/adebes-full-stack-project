import { z } from "zod";

import { FAQ_TOPIC_LABELS, FAQ_TOPICS } from "../../entities/faq-item";
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
 *  QUESTIONS FRÉQUENTES — `<FAQAccordion>`
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Les questions publiées, filtrées par sujet. Trois pages en portent une —
 * l'accueil, `/don`, `/benevolat` — et chacune montre un sous-ensemble
 * différent, ce que `source` exprime.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  « accueil » N'EST PAS UN SUJET, C'EST UNE SÉLECTION
 * ---------------------------------------------------------------------------
 * `FAQ_TOPICS` en compte trois : `don`, `benevolat`, `general`. La quatrième
 * valeur de ce champ — `accueil` — désigne la règle posée au Lot 8F dans
 * `estAffichableSurAccueil()` : **toutes les questions sauf celles du
 * bénévolat**, parce qu'une question de bénévole n'a rien à faire sur la page
 * d'accueil d'un donateur potentiel.
 *
 * Cette règle vit dans le domaine des questions, pas ici. Ce champ ne fait que
 * la NOMMER, et le `Renderer` appelle `getFaqAccueil()` plutôt que de recopier
 * le filtre. C'est ce qui garantit que `/dashboard/faq` continue de dire à qui
 * réordonne la liste exactement ce que la page affichera.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CE BLOC ÉMET DU BALISAGE STRUCTURÉ — LA SEULE DE CES DIX-SEPT À LE FAIRE
 * ---------------------------------------------------------------------------
 * Le Lot 8F a établi qu'une section FAQ publie un JSON-LD `FAQPage`, et que le
 * balisage doit contenir **ce que le visiteur lit** — réponse ET puces, via
 * `texteReponse()`. Deux conséquences que le `Renderer` doit respecter :
 *
 *   1. **aucun balisage si la liste est vide** — un `FAQPage` sans `mainEntity`
 *      est une déclaration fausse envoyée aux moteurs de recherche ;
 *   2. **un seul bloc FAQ par page.** Deux `FAQPage` sur une même URL est une
 *      erreur de balisage. L'éditeur en avertit à l'ajout.
 */

const SOURCES = ["accueil", ...FAQ_TOPICS] as const;

const schema = z.object(
  {
    ...enteteAligneShape,
    /** Quelles questions afficher. Voir l'avertissement ci-dessus sur « accueil ». */
    source: z.enum(SOURCES, { message: "Choisissez les questions à afficher." }),
    /** Ouvre la première question au chargement. */
    openFirst: z.boolean("Choix invalide."),
    background: fondSchema,
    footerText: z
      .string("Le texte de fin doit être du texte.")
      .trim()
      .max(200, "Ce texte est trop long (200 caractères maximum)."),
    footerLinkLabel: libelleLienSchema,
    footerHref: lienSchema,
  },
  { message: "Contenu de bloc questions fréquentes invalide." },
);

export type FaqContent = z.infer<typeof schema>;

export const faqBlock: BlockDefinition<typeof schema> = {
  type: "faq",
  label: "Questions fréquentes",
  description:
    "Affiche les questions publiées d'un sujet, en accordéon. Génère aussi le balisage que lisent les moteurs de recherche.",
  category: "contenu",
  collection: "Questions fréquentes",
  schema,
  defaults: {
    ...DEFAUTS_ENTETE_ALIGNE,
    align: "center",
    source: "accueil",
    openFirst: false,
    background: "default",
    footerText: "",
    footerLinkLabel: "",
    footerHref: "",
  },
  fields: [
    ...champsEntete(),
    {
      kind: "select",
      name: "source",
      label: "Questions à afficher",
      options: [
        {
          value: "accueil",
          label: "Sélection d'accueil — toutes sauf le bénévolat",
        },
        ...FAQ_TOPICS.map((sujet) => ({
          value: sujet,
          label: FAQ_TOPIC_LABELS[sujet],
        })),
      ],
      required: true,
      hint: "Le sujet de chaque question se règle dans « Questions fréquentes ».",
    },
    {
      kind: "boolean",
      name: "openFirst",
      label: "Ouvrir la première question",
      hint: "Utile quand la section ne contient que deux ou trois questions.",
    },
    champFond(),
    {
      kind: "text",
      name: "footerText",
      label: "Phrase de fin",
      maxLength: 200,
      hint: "Affichée sous l'accordéon. Laissez vide pour ne rien afficher.",
      placeholder: "Une autre question ?",
    },
    {
      kind: "text",
      name: "footerLinkLabel",
      label: "Libellé du lien de fin",
      maxLength: 60,
      placeholder: "Écrivez-nous",
    },
    {
      kind: "link",
      name: "footerHref",
      label: "Lien de fin",
    },
  ],
};
