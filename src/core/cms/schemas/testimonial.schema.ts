import { z } from "zod";

import { CONTENT_STATUSES } from "../entities/content-status";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION DU TÉMOIGNAGE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagés client et serveur, comme aux Lots 8A et 8B : la validation côté
 * client améliore le confort, celle côté serveur est la seule qui protège —
 * une Server Action est joignable par un POST direct, sans passer par le
 * formulaire.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `slugSchema` ICI, ET C'EST NORMAL
 * ---------------------------------------------------------------------------
 * Un témoignage n'a pas d'adresse : il n'existe aucune page
 * `/temoignages/<slug>`, ni dans le site actuel, ni dans les 17 lots. Il
 * s'affiche là où on le cite. C'est la première collection du Lot 8 dans ce
 * cas, et c'est ce qui explique l'absence de `findBySlug` sur son port.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `hasConsent` N'EST PAS FORCÉ À `true` PAR CE SCHÉMA — VOIR L'ÉCART
 * ---------------------------------------------------------------------------
 * Le §8C écrit : « une case à cocher obligatoire […] avant enregistrement ».
 * Prise au pied de la lettre, la règle rendrait impossible d'enregistrer un
 * BROUILLON tant que l'accord n'est pas revenu — et, pire, elle obligerait
 * quiconque corrige une faute de frappe sur une entrée existante à cocher une
 * attestation qu'il n'est pas en mesure d'honorer. Une case qu'on est contraint
 * de cocher pour travailler cesse d'attester quoi que ce soit.
 *
 * L'accord est donc exigé là où il protège réellement quelqu'un — **à la
 * publication** — et il l'est deux fois :
 *
 *   * `setTestimonialStatus` refuse de mettre en ligne sans accord ;
 *   * `updateTestimonial` refuse de RETIRER l'accord d'un témoignage encore en
 *     ligne, et dit qu'il faut le dépublier d'abord.
 *
 * C'est aussi la lettre de la règle d'origine, qui parle de publication :
 * « une citation n'est **publiée** que si […] la personne a donné son accord »
 * (`src/content/temoignages.ts`). Et c'est le précédent du projet : un
 * brouillon a le droit d'être incomplet, c'est même sa raison d'être
 * (`set-programme-status.ts`).
 */

/**
 * ⚠️  CHAQUE CHAMP PORTE SON MESSAGE, Y COMPRIS CEUX QUE PERSONNE NE SAISIT.
 *
 * `id`, `createdAt`, `updatedAt` ne viennent jamais d'un formulaire, et
 * `programmeId`/`photoMediaId`/`hasConsent` sont toujours fournis par
 * `<SchemaForm>` via ses `defaultValues`. Sans message explicite, Zod produit
 * pourtant « Invalid input: expected string, received undefined » — de
 * l'anglais, dans un projet dont la règle est que le `message` d'une erreur est
 * destiné à être affiché tel quel à un utilisateur non technique.
 *
 * Le raisonnement « ce cas est inatteignable » est exactement celui qui laisse
 * un jour passer un message anglais à l'écran, le jour où un appelant nouveau
 * rend le cas atteignable. La recette du Lot 8C vérifie qu'aucun des six
 * schémas de ce fichier ne produit un message anglais, quelle que soit
 * l'entrée.
 */
export const testimonialSchema = z.object({
  id: z.uuid("Identifiant de témoignage invalide."),
  /*
    ⚠️  LE MESSAGE EST DONNÉ DEUX FOIS, ET LES DEUX SERVENT.

    `z.string("…")` couvre l'erreur de TYPE — champ absent, nombre, `null` —
    et `.min(n, "…")` l'erreur de LONGUEUR. Zod s'arrête au premier échec :
    sur un champ absent, seule la première s'applique. Un
    `z.string().min(20, "…")` sans message de type produit donc, pour une
    charge utile amputée, « Invalid input: expected string, received
    undefined » — de l'anglais, affiché tel quel à l'utilisateur.

    Le cas n'est pas théorique : une Server Action est joignable par un POST
    direct, et le §8C exige que TOUT message soit en français. Mesuré en
    recette (A44), pas déduit.
  */
  quote: z
    .string("La citation est obligatoire.")
    .trim()
    .min(20, "La citation est obligatoire (20 caractères minimum).")
    .max(500, "La citation est trop longue (500 caractères maximum)."),
  authorName: z
    .string("Le prénom est obligatoire.")
    .trim()
    .min(2, "Le prénom est obligatoire.")
    .max(80, "Ce nom est trop long (80 caractères maximum)."),
  authorRole: z
    .string("Le rôle est obligatoire : bénéficiaire, bénévole, partenaire…")
    .trim()
    .min(3, "Le rôle est obligatoire : bénéficiaire, bénévole, partenaire…")
    .max(120, "Ce rôle est trop long (120 caractères maximum)."),
  programmeId: z.uuid("Ce programme n'existe pas.").nullable(),
  photoMediaId: z.uuid("Cette photo n'existe pas.").nullable(),
  hasConsent: z.boolean({ message: "Indiquez si la personne a donné son accord." }),
  position: z.number("Position invalide.").int().min(0),
  status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
  createdAt: z.string("Date de création invalide."),
  updatedAt: z.string("Date de modification invalide."),
});

/**
 * Création.
 *
 * ⚠️  `status` EST ABSENT DE CE SCHÉMA, contrairement aux Lots 8A et 8B.
 *
 * Là-bas, `status` restait facultatif dans la charge utile : le cas d'usage y
 * mettait `'draft'` par défaut, et un `status: 'published'` envoyé par un POST
 * direct était arrêté plus loin par le trigger `guard_publish` (ADB01). Ici,
 * cette porte donnerait à un administrateur — qui, lui, passe le trigger — le
 * moyen de créer un témoignage DÉJÀ EN LIGNE, sans jamais traverser
 * `setTestimonialStatus`, seul endroit où l'accord de la personne est exigé.
 *
 * Le champ est donc retiré du contrat d'entrée : un témoignage naît en
 * brouillon, sans exception et sans qu'aucune requête ne puisse en décider
 * autrement. `position` reste facultatif — il est calculé, pas décidé.
 */
export const createTestimonialSchema = testimonialSchema
  .omit({ id: true, createdAt: true, updatedAt: true, status: true })
  .extend({
    position: z.number("Position invalide.").int().min(0).optional(),
    programmeId: z.uuid("Ce programme n'existe pas.").nullable().default(null),
    photoMediaId: z.uuid("Cette photo n'existe pas.").nullable().default(null),
    hasConsent: z
      .boolean({ message: "Indiquez si la personne a donné son accord." })
      .default(false),
  });

/** Modification partielle : seuls les champs envoyés sont validés. */
export const updateTestimonialSchema = testimonialSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ id: z.uuid("Identifiant de témoignage invalide.") });

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SCHÉMA DU FORMULAIRE — distinct des deux précédents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Troisième schéma, pour la même raison qu'aux écarts nº 50, 58 et 71 :
 * `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE identique au type de
 * SORTIE. `createTestimonialSchema` porte trois `.default(...)` et
 * `updateTestimonialSchema` est `.partial()` : les deux ont entrée ≠ sortie.
 *
 * Les trois partagent leurs briques : les règles ne peuvent pas diverger,
 * seule l'enveloppe change.
 *
 * ⚠️  Aucune sentinelle ici, contrairement à `categoryId` au Lot 8B : le champ
 * `programmeId` est un `kind: "reference"`, dont la valeur vide est déjà `null`
 * (`ReferenceField`, `defaultValue: null`). C'est Radix `<Select>` qui refusait
 * la chaîne vide, pas react-hook-form.
 */
export const testimonialFormSchema = z.object({
  quote: testimonialSchema.shape.quote,
  authorName: testimonialSchema.shape.authorName,
  authorRole: testimonialSchema.shape.authorRole,
  programmeId: z.uuid("Ce programme n'existe pas.").nullable(),
  photoMediaId: z.uuid("Cette photo n'existe pas.").nullable(),
  hasConsent: z.boolean({
    message: "Indiquez si la personne a donné son accord.",
  }),
});

/** Désigne un témoignage — suppression, publication, lecture d'une fiche. */
export const testimonialIdSchema = z.object({
  id: z.uuid("Identifiant de témoignage invalide."),
});

/** Changement d'état éditorial — publication, dépublication, archivage. */
export const setTestimonialStatusSchema = z.object({
  id: z.uuid("Identifiant de témoignage invalide."),
  status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
});

/**
 * Réordonnancement.
 *
 * La liste est ENTIÈRE et dans le nouvel ordre — le cas d'usage refuse une
 * liste partielle. Ce schéma ne vérifie que la forme.
 */
export const reorderTestimonialsSchema = z.object({
  orderedIds: z
    .array(z.uuid("Identifiant de témoignage invalide."), {
      message: "La liste des témoignages à réordonner est absente.",
    })
    .min(1, "Aucun élément à réordonner."),
});

export type TestimonialInput = z.infer<typeof testimonialSchema>;
export type CreateTestimonialInput = z.infer<typeof createTestimonialSchema>;
export type UpdateTestimonialInput = z.infer<typeof updateTestimonialSchema>;
export type TestimonialFormInput = z.infer<typeof testimonialFormSchema>;
