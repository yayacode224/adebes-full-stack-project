import { contact, TODO } from "@/lib/site-config";

export type FaqItem = {
  question: string;
  /** Réponse en texte simple ; les listes sont rendues en puces. */
  answer: string;
  bullets?: string[];
  /** Groupe d'affichage : la page /don n'affiche que les questions « don ». */
  topic: "don" | "benevolat" | "general";
};

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️  CE FICHIER N'EST PLUS IMPORTÉ PAR AUCUNE PAGE NI AUCUN COMPOSANT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Depuis le Lot 8F, les questions fréquentes vivent en base (`faq_items`) et se
 * gèrent depuis `/dashboard/faq`. Les trois pages qui les affichaient —
 * l'accueil, « Faire un don » et « Devenir bénévole » — lisent désormais
 * `src/server/queries/faq.query.ts`, et `<FAQAccordion>` reçoit l'entité de
 * domaine `FaqItem` de `src/core/cms/entities/faq-item.ts`.
 *
 * Le fichier est CONSERVÉ jusqu'au Lot 16, comme `programmes.ts`,
 * `actualites.ts`, `temoignages.ts` et `valeurs.ts` : c'est la référence qui
 * permet de vérifier que la migration n'a rien perdu. Les sept lignes de la
 * base doivent lui correspondre mot pour mot, aux valeurs interpolées près
 * (téléphone, e-mail, numéro d'enregistrement) que le seed du Lot 1 a
 * matérialisées.
 *
 * ⚠️  NE PAS le modifier pour corriger une question : la source de vérité est
 * la base. Une correction faite ici ne s'afficherait nulle part.
 *
 * ---------------------------------------------------------------------------
 * FAQ reprise de l'ancien site et enrichie.
 *
 * La réponse « Comment faire un don » ne mentionne plus WhatsApp comme unique
 * canal (constat §4.3 de l'audit : un seul canal de conversion excluait les
 * donateurs sans WhatsApp et la diaspora).
 */
export const faq: FaqItem[] = [
  {
    topic: "don",
    question: "Comment faire un don à ADEBES ?",
    answer:
      "Plusieurs canaux sont possibles. Le plus direct reste WhatsApp, où un membre de l'équipe vous répond et vous accompagne dans la démarche.",
    bullets: [
      `WhatsApp : ${contact.phoneDisplay} — réponse pendant les heures d'ouverture`,
      `Par e-mail : ${contact.email}`,
      "Mobile Money (Orange Money, MTN Mobile Money) : coordonnées communiquées sur demande",
      "Virement bancaire : coordonnées communiquées sur demande",
    ],
  },
  {
    topic: "don",
    question: "Mon don est-il bien utilisé ?",
    answer:
      "Chaque don est affecté à un programme identifié. Un rapport d'utilisation est envoyé sur demande aux donateurs, et les rapports d'activité de l'association sont publiés sur la page Impact et transparence dès leur validation.",
  },
  {
    topic: "don",
    question: "Puis-je choisir le programme que je soutiens ?",
    answer:
      "Oui. Indiquez simplement le programme concerné lors de votre prise de contact : votre don lui sera affecté en priorité.",
  },
  {
    topic: "benevolat",
    question: "Comment devenir bénévole ?",
    answer:
      "Remplissez le formulaire de candidature sur la page Devenir bénévole : indiquez votre domaine d'intérêt et vos disponibilités. Un membre de l'équipe vous recontacte pour un premier échange.",
  },
  {
    topic: "benevolat",
    question: "Faut-il une compétence particulière pour être bénévole ?",
    answer:
      "Non. Certaines missions demandent une qualification (santé, formation professionnelle, accompagnement psychosocial), mais beaucoup d'actions reposent avant tout sur la disponibilité et l'engagement.",
  },
  {
    topic: "general",
    question: "Où intervenez-vous au Cameroun ?",
    answer:
      "Principalement à Douala et Yaoundé, ainsi que dans les régions de l'intérieur du pays selon les programmes et les besoins identifiés.",
  },
  {
    topic: "general",
    question: "ADEBES est-elle une association légalement enregistrée ?",
    answer: `ADEBES est une association camerounaise à but non lucratif. Numéro d'enregistrement : ${TODO}. Les informations légales complètes figurent dans les mentions légales.`,
  },
];

export function faqByTopic(topic: FaqItem["topic"] | "all"): FaqItem[] {
  return topic === "all" ? faq : faq.filter((item) => item.topic === topic);
}
