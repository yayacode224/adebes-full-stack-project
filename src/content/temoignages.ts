/**
 * Témoignages.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️  CE FICHIER N'EST PLUS IMPORTÉ PAR AUCUNE PAGE DEPUIS LE LOT 8C
 * ═══════════════════════════════════════════════════════════════════════════
 * Les témoignages viennent de la base (`server/queries/testimonials.query.ts`).
 * Le fichier reste — comme `programmes.ts` et `actualites.ts` — pour sa valeur
 * de référence : c'est ici qu'est écrite la règle absolue du projet sur le
 * consentement, celle que `setTestimonialStatus` applique désormais. Il sera
 * retiré au Lot 16.
 *
 * `temoignagePhoto()` n'a plus d'appelant, et ce n'est pas un oubli : sa
 * convention de nommage est indexée sur l'identifiant de CE tableau, qui
 * n'existe plus en base. Le raisonnement complet — et pourquoi aucune colonne
 * de `testimonials` ne peut le remplacer sans risquer d'attribuer un visage à
 * la parole de quelqu'un d'autre — est dans l'en-tête de
 * `src/components/cards/testimonial-card.tsx`.
 *
 * L'audit relève (§4.2) qu'aucune histoire individuelle n'était mise en avant :
 * seul du texte générique décrivait chaque programme. Un témoignage court et
 * signé vaut mieux qu'un paragraphe institutionnel.
 *
 * Règle absolue : une citation n'est publiée que si la personne l'a réellement
 * prononcée et a donné son accord — pour le texte comme pour la photo. Les
 * entrées ci-dessous sont donc des gabarits explicitement marqués, jamais de
 * fausses paroles attribuées à de vraies personnes.
 */

export type Temoignage = {
  id: string;
  /** Citation courte — 2 phrases maximum. */
  quote: string;
  /** Prénom, ou prénom + initiale. Jamais un nom complet sans accord écrit. */
  name: string;
  /** Rôle : bénéficiaire, bénévole, partenaire… */
  role: string;
  /** Programme concerné, pour relier le témoignage à une page. */
  programmeSlug?: string;
  placeholder?: boolean;
};

export const temoignages: Temoignage[] = [
  {
    id: "exemple-beneficiaire",
    quote:
      "Emplacement réservé au témoignage d'un bénéficiaire. Deux phrases suffisent : ce qui a changé, et grâce à quoi.",
    name: "Prénom",
    role: "Bénéficiaire du programme Éducation",
    programmeSlug: "education",
    placeholder: false,
  },
  {
    id: "exemple-benevole",
    quote:
      "Emplacement réservé au témoignage d'un bénévole. Décrivez en quelques mots la mission et ce qu'elle apporte.",
    name: "Prénom",
    role: "Bénévole depuis 2 ans",
    programmeSlug: "developpement-communautaire",
    placeholder: false,
  },
  {
    id: "exemple-partenaire",
    quote:
      "Emplacement réservé au témoignage d'un partenaire : entreprise, école ou structure de santé ayant travaillé avec ADEBES.",
    name: "Prénom",
    role: "Partenaire",
    programmeSlug: "sante",
    placeholder: false,
  },
];

export function temoignagePhoto(id: string): string {
  return `/images/temoignages/temoignage-${id}.jpg`;
}
