import { z } from "zod";

import { CONTENT_STATUSES } from "../entities/content-status";
import { MEDIA_TONES } from "../entities/media-tone";
import { isValidSlug, SLUG_MAX_LENGTH } from "../../shared/slug";

/**
 * Schémas de validation du programme.
 *
 * Partagés client et serveur, comme `src/lib/schemas.ts` : la validation côté
 * client améliore le confort, celle côté serveur est la seule qui protège —
 * une Server Action est joignable par un POST direct, sans passer par le
 * formulaire.
 *
 * Tous les messages sont en français et rédigés pour un utilisateur non
 * technique : ils s'affichent tels quels sous le champ concerné.
 *
 * Syntaxe Zod 4, alignée sur l'existant : `z.enum(tableau, { message })`.
 */

/** Réutilisé par toutes les entités à adresse : programmes, articles, pages. */
export const slugSchema = z
  .string()
  .trim()
  .min(1, "L'adresse de la page est obligatoire.")
  .max(SLUG_MAX_LENGTH, `L'adresse ne doit pas dépasser ${SLUG_MAX_LENGTH} caractères.`)
  .refine(isValidSlug, {
    message:
      "L'adresse ne peut contenir que des lettres sans accent, des chiffres et des tirets.",
  });

/**
 * Liste de textes courts — sert à `actions`, `publics` et `besoins`.
 *
 * Le libellé du champ est passé en paramètre pour que le message d'erreur
 * nomme ce qui manque (« Ajoutez au moins une action. ») plutôt que d'afficher
 * un « ce champ est requis » anonyme sous une liste de trois champs
 * identiques.
 */
function listeDeTextes(singulier: string, pluriel: string) {
  return z
    .array(
      z
        .string()
        .trim()
        .min(1, "Cette ligne est vide : renseignez-la ou supprimez-la.")
        .max(200, "Cette ligne est trop longue (200 caractères maximum)."),
    )
    .min(1, `Ajoutez au moins ${singulier}.`)
    .max(20, `Pas plus de 20 ${pluriel}.`);
}

export const programmeSchema = z.object({
  id: z.string().uuid(),
  slug: slugSchema,
  title: z
    .string()
    .trim()
    .min(3, "Le titre est obligatoire (3 caractères minimum).")
    .max(120, "Le titre est trop long (120 caractères maximum)."),
  shortTitle: z
    .string()
    .trim()
    .min(2, "Le titre court est obligatoire.")
    .max(40, "Le titre court est trop long (40 caractères maximum)."),
  summary: z
    .string()
    .trim()
    .min(10, "Le résumé est obligatoire (10 caractères minimum).")
    .max(300, "Le résumé est trop long (300 caractères maximum)."),
  icon: z
    .string()
    .trim()
    .min(1, "Choisissez une icône."),
  tone: z.enum(MEDIA_TONES, { message: "Choisissez une teinte." }),
  actions: listeDeTextes("une action", "actions"),
  publics: listeDeTextes("un public", "publics"),
  besoins: listeDeTextes("un besoin", "besoins"),
  benevolatLabel: z
    .string()
    .trim()
    .min(3, "Ce libellé est obligatoire : il alimente le formulaire de bénévolat.")
    .max(80, "Ce libellé est trop long (80 caractères maximum)."),
  coverMediaId: z.string().uuid().nullable(),
  galleryMediaIds: z.array(z.string().uuid()).max(24, "Pas plus de 24 images."),
  body: z.array(z.string().trim().min(1)).nullable(),
  position: z.number().int().min(0),
  status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
  createdAt: z.string(),
  updatedAt: z.string(),
});

/**
 * Création.
 *
 * `slug` est facultatif : il est proposé à partir du titre par le cas d'usage,
 * et l'utilisateur peut le corriger. `position` et `status` ont des valeurs par
 * défaut — un nouveau programme naît en brouillon, jamais en ligne.
 */
export const createProgrammeSchema = programmeSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    slug: slugSchema.optional(),
    position: z.number().int().min(0).optional(),
    status: z.enum(CONTENT_STATUSES).optional(),
    coverMediaId: z.string().uuid().nullable().default(null),
    galleryMediaIds: z.array(z.string().uuid()).max(24).default([]),
    body: z.array(z.string().trim().min(1)).nullable().default(null),
  });

/** Modification partielle : seuls les champs envoyés sont validés. */
export const updateProgrammeSchema = programmeSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ id: z.string().uuid() });

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SCHÉMA DU FORMULAIRE — distinct des deux précédents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Même raison qu'au Lot 7 pour `mediaFicheSchema` (écart nº 50) :
 * `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE identique au type de
 * SORTIE. Or les deux schémas ci-dessus divergent sur ce point :
 *
 *   * `createProgrammeSchema` porte trois `.default(...)` : `coverMediaId`,
 *     `galleryMediaIds` et `body` sont facultatifs en entrée et garantis en
 *     sortie ;
 *   * `updateProgrammeSchema` est `.partial()` : tous ses champs sont
 *     facultatifs, ce qui laisserait `<SchemaForm>` accepter un formulaire
 *     entièrement vide sans le signaler.
 *
 * Ce troisième schéma décrit ce que le FORMULAIRE contient réellement : tous
 * les champs présents, aucun défaut, aucune transformation. Il partage ses
 * briques avec les deux autres (`slugSchema`, `listeDeTextes`) — les règles ne
 * peuvent donc pas diverger, seule l'enveloppe change.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI `body` N'EST PAS DANS LE FORMULAIRE
 * ---------------------------------------------------------------------------
 * Le §8A.2 énumère les champs « repris EXACTEMENT du type `Programme` de
 * `src/content/programmes.ts` », et ce type n'a pas de `body`. La colonne
 * existe en base et l'entité la porte, mais aucune page publique ne la rend
 * aujourd'hui : offrir un champ dont la saisie ne s'affiche nulle part serait
 * pire que de ne pas l'offrir. Il reste `null` et n'est jamais écrit — les
 * champs `undefined` ne sont pas transmis par le dépôt.
 */
export const programmeFormSchema = z.object({
  title: programmeSchema.shape.title,
  slug: slugSchema,
  shortTitle: programmeSchema.shape.shortTitle,
  summary: programmeSchema.shape.summary,
  icon: programmeSchema.shape.icon,
  tone: programmeSchema.shape.tone,
  actions: listeDeTextes("une action", "actions"),
  publics: listeDeTextes("un public", "publics"),
  besoins: listeDeTextes("un besoin", "besoins"),
  benevolatLabel: programmeSchema.shape.benevolatLabel,
  coverMediaId: z.uuid().nullable(),
  galleryMediaIds: z.array(z.uuid()).max(24, "Pas plus de 24 images."),
});

/** Désigne un programme — suppression, publication, lecture d'une fiche. */
export const programmeIdSchema = z.object({
  id: z.uuid("Identifiant de programme invalide."),
});

/**
 * Réordonnancement.
 *
 * La liste est ENTIÈRE et dans le nouvel ordre — voir `reorderProgrammes`,
 * qui refuse une liste partielle. Le cas d'usage revérifie l'exhaustivité :
 * ce schéma ne vérifie que la forme.
 */
export const reorderProgrammesSchema = z.object({
  orderedIds: z
    .array(z.uuid())
    .min(1, "Aucun élément à réordonner."),
});

/** Changement d'état éditorial — publication, dépublication, archivage. */
export const setProgrammeStatusSchema = z.object({
  id: z.uuid("Identifiant de programme invalide."),
  status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
});

export type ProgrammeInput = z.infer<typeof programmeSchema>;
export type CreateProgrammeInput = z.infer<typeof createProgrammeSchema>;
export type UpdateProgrammeInput = z.infer<typeof updateProgrammeSchema>;
export type ProgrammeFormInput = z.infer<typeof programmeFormSchema>;
