import { z } from "zod";

/**
 * Schémas de validation partagés entre le client et le serveur.
 *
 * Le même schéma est appliqué des deux côtés : la validation côté client
 * améliore le confort, mais la validation côté serveur est la seule qui
 * protège réellement — une Server Action est joignable par une requête POST
 * directe, sans passer par le formulaire.
 */

/** Numéros camerounais et internationaux, espaces et séparateurs tolérés. */
const phoneRegex = /^[+()\d\s.-]{8,20}$/;

/**
 * Champ piège invisible : un robot remplit tous les champs qu'il trouve, un
 * humain ne voit jamais celui-ci. S'il est rempli, la soumission est rejetée
 * silencieusement.
 */
const honeypot = z.string().max(0, "Soumission rejetée.").optional();

const consent = z.literal(true, {
  message: "Merci d'accepter que nous utilisions vos données pour vous répondre.",
});

export const contactSubjects = [
  "Faire un don",
  "Devenir bénévole",
  "Proposer un partenariat",
  "Demander une information",
  "Autre",
] as const;

export const contactSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indiquez votre nom (2 caractères minimum).")
    .max(80, "Nom trop long."),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .email("Cette adresse e-mail ne semble pas valide."),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Ce numéro de téléphone ne semble pas valide.")
    .optional()
    .or(z.literal("")),
  subject: z.enum(contactSubjects, { message: "Choisissez un sujet." }),
  message: z
    .string()
    .trim()
    .min(10, "Votre message doit contenir au moins 10 caractères.")
    .max(3000, "Votre message est trop long (3000 caractères maximum)."),
  consent,
  website: honeypot,
});

export type ContactInput = z.infer<typeof contactSchema>;

export const disponibilites = [
  "Quelques heures par mois",
  "Un jour par semaine",
  "Plusieurs jours par semaine",
  "Ponctuellement, lors des campagnes",
  "À définir ensemble",
] as const;

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE DOMAINE D'ENGAGEMENT — CHANGEMENT DU LOT 8A
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ce champ était un `z.enum(...)` construit depuis
 * `programmes.map(p => p.benevolatLabel)`, en statique. Les programmes vivent
 * désormais en base, et la liste change quand quelqu'un publie un programme
 * depuis le dashboard.
 *
 * Un schéma Zod partagé client/serveur ne peut pas être asynchrone : il est
 * évalué à l'import, des deux côtés de la frontière. La réponse retenue par le
 * §8A.2 du Rapport 2 est donc en deux temps :
 *
 *   1. **ici** — `z.string().min(1)` : le champ est obligatoire, sa FORME est
 *      validée des deux côtés comme avant ;
 *   2. **dans la Server Action** (`submitVolunteer`) — l'appartenance à la
 *      liste réelle est vérifiée, avec un message dédié. C'est la seule
 *      vérification qui protège : le formulaire n'est pas la frontière.
 *
 * La liste des options affichées est passée en props au composant depuis un
 * Server Component (`src/app/(site)/benevolat/page.tsx`).
 *
 * ⚠️  Le message d'erreur ne nomme PAS la liste attendue : elle est dynamique,
 * et une énumération figée dans un message serait fausse au premier ajout.
 */
export const volunteerSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Indiquez votre nom (2 caractères minimum).")
    .max(80, "Nom trop long."),
  email: z
    .string()
    .trim()
    .min(1, "L'adresse e-mail est obligatoire.")
    .email("Cette adresse e-mail ne semble pas valide."),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, "Ce numéro de téléphone ne semble pas valide."),
  city: z
    .string()
    .trim()
    .min(2, "Indiquez votre ville.")
    .max(80, "Nom de ville trop long."),
  domain: z.string().trim().min(1, "Choisissez un domaine d'intérêt."),
  availability: z.enum(disponibilites, {
    message: "Indiquez vos disponibilités.",
  }),
  message: z
    .string()
    .trim()
    .max(3000, "Votre message est trop long (3000 caractères maximum).")
    .optional()
    .or(z.literal("")),
  consent,
  website: honeypot,
});

export type VolunteerInput = z.infer<typeof volunteerSchema>;
