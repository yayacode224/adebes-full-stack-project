import { z } from "zod";

import { CONTENT_STATUSES } from "../entities/content-status";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION DU MEMBRE DE L'ÉQUIPE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagés client et serveur, comme aux Lots 8A à 8C : la validation côté
 * client améliore le confort, celle côté serveur est la seule qui protège —
 * une Server Action est joignable par un POST direct, sans passer par le
 * formulaire.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `slugSchema` ICI, COMME AU LOT 8C
 * ---------------------------------------------------------------------------
 * Un membre de l'équipe n'a pas d'adresse : il n'existe aucune page
 * `/equipe/<slug>`, ni dans le site actuel, ni dans les 17 lots. Il s'affiche
 * dans la section « L'équipe » de `/a-propos`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUN CHAMP N'EST REFUSÉ PARCE QU'IL VAUT « [À COMPLÉTER] »
 * ---------------------------------------------------------------------------
 * La reconnaissance du marqueur (`estNomAFournir`, entité `TeamMember`) est
 * une règle de PUBLICATION, pas de saisie — même partage qu'au Lot 8C pour
 * l'accord de la personne citée.
 *
 * L'interdire ici rendrait les trois lignes du seed impossibles à
 * ENREGISTRER : ouvrir la fiche de la direction pour y déposer une photo, sans
 * connaître encore le nom, échouerait sur un champ qu'on n'a pas touché. Un
 * brouillon a le droit d'être incomplet, c'est même sa raison d'être
 * (`set-programme-status.ts`). Ce qui n'a pas le droit d'exister, c'est un
 * marqueur AFFICHÉ SUR LE SITE — et c'est `setTeamMemberStatus` qui l'empêche.
 */

/**
 * ⚠️  CHAQUE CHAMP PORTE SON MESSAGE, Y COMPRIS CEUX QUE PERSONNE NE SAISIT.
 *
 * Écart nº 90, mesuré au Lot 8C : `z.string().min(n, "…")` sans message de
 * TYPE produit « Invalid input: expected string, received undefined » dès que
 * le champ est absent de la charge utile — de l'anglais, dans un projet dont
 * la règle est que le `message` d'une erreur est affiché tel quel à un
 * utilisateur non technique. Le cas n'est pas théorique : une Server Action
 * est joignable par un POST direct.
 *
 * `z.string("…")` couvre l'erreur de type, `.min(n, "…")` celle de longueur.
 * Zod s'arrête au premier échec : il faut donc les deux.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  ET UN TROISIÈME NIVEAU, TROUVÉ AU LOT 8D : L'OBJET LUI-MÊME
 * ---------------------------------------------------------------------------
 * Les messages de champ ne servent à rien si la charge utile n'est pas un
 * objet du tout. `schema.safeParse("bonjour")`, `safeParse(null)`,
 * `safeParse([])` produisent « Invalid input: expected object, received
 * string » — de l'anglais, et aucun champ n'est en cause.
 *
 * Le cas est atteignable : une Server Action désérialise ce qu'on lui envoie,
 * et un POST direct n'a aucune obligation d'envoyer un objet. D'où le
 * `{ message: "…" }` en SECOND ARGUMENT de chaque `z.object` ci-dessous.
 *
 * Le message se propage aux schémas dérivés — `.omit()`, `.extend()`,
 * `.partial()` le conservent — ce que la recette vérifie sur les sept schémas
 * de ce fichier, avec dix charges hostiles chacun.
 *
 * ⚠️  CE TROU EXISTE ENCORE dans `programme.schema.ts`, `article.schema.ts` et
 * `testimonial.schema.ts` : leurs `z.object` n'ont pas de second argument. Il
 * est consigné pour le Lot 16, avec celui de l'écart nº 90 — corriger sans
 * rejouer la recette de ces lots ne prouverait rien.
 */
export const teamMemberSchema = z.object({
  id: z.uuid("Identifiant de membre invalide."),
  name: z
    .string("Le nom est obligatoire.")
    .trim()
    .min(2, "Le nom est obligatoire.")
    .max(120, "Ce nom est trop long (120 caractères maximum)."),
  role: z
    .string("La fonction est obligatoire.")
    .trim()
    .min(3, "La fonction est obligatoire : direction, coordination…")
    .max(120, "Cette fonction est trop longue (120 caractères maximum)."),
  /*
    `bio` est NULLABLE en base (migration 0005), et le reste ici.

    `null` (« pas de biographie ») et `""` (« biographie vide ») décriraient la
    même chose avec deux valeurs différentes : la carte publique n'affiche le
    paragraphe que s'il y a du texte. Le formulaire, lui, manipule une chaîne —
    c'est ce que rend un `<textarea>` — et convertit `""` en `null` au moment
    d'appeler la Server Action. La conversion est faite à UN endroit, dans
    `team-member-form.tsx`, et elle y est commentée.
  */
  bio: z
    .string("Biographie invalide.")
    .trim()
    .max(400, "Cette biographie est trop longue (400 caractères maximum).")
    .nullable(),
  photoMediaId: z.uuid("Cette photo n'existe pas.").nullable(),
  position: z.number("Position invalide.").int().min(0),
  status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
  createdAt: z.string("Date de création invalide."),
  updatedAt: z.string("Date de modification invalide."),
}, { message: "Fiche de membre invalide." });

/**
 * Création.
 *
 * ⚠️  `status` EST ABSENT DE CE SCHÉMA, comme au Lot 8C et contrairement aux
 * Lots 8A et 8B.
 *
 * Là-bas, `status` restait facultatif : un `status: 'published'` envoyé par un
 * POST direct était arrêté plus loin par le trigger `guard_publish` (ADB01).
 * Ici, cette porte donnerait à un administrateur — qui, lui, passe le
 * trigger — le moyen de créer un membre DÉJÀ EN LIGNE sans jamais traverser
 * `setTeamMemberStatus`, seul endroit où l'on vérifie que le nom affiché en
 * est un.
 *
 * Le champ est donc retiré du contrat d'entrée. `position` reste facultatif —
 * il est calculé, pas décidé.
 */
export const createTeamMemberSchema = teamMemberSchema
  .omit({ id: true, createdAt: true, updatedAt: true, status: true })
  .extend({
    position: z.number("Position invalide.").int().min(0).optional(),
    bio: z
      .string("Biographie invalide.")
      .trim()
      .max(400, "Cette biographie est trop longue (400 caractères maximum).")
      .nullable()
      .default(null),
    photoMediaId: z.uuid("Cette photo n'existe pas.").nullable().default(null),
  });

/** Modification partielle : seuls les champs envoyés sont validés. */
export const updateTeamMemberSchema = teamMemberSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ id: z.uuid("Identifiant de membre invalide.") });

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SCHÉMA DU FORMULAIRE — distinct des deux précédents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Troisième schéma, pour la raison des écarts nº 50, 58, 71 et 86 :
 * `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE identique au type de
 * SORTIE. `createTeamMemberSchema` porte deux `.default(...)` et
 * `updateTeamMemberSchema` est `.partial()` : les deux ont entrée ≠ sortie.
 *
 * ⚠️  `bio` y est une CHAÎNE, pas `string | null`. C'est la seule divergence
 * de forme entre ce schéma et les deux autres, et elle est imposée par le
 * champ : un `<textarea>` vide rend `""`. La conversion `"" → null` est faite
 * dans `team-member-form.tsx`, juste avant l'appel de la Server Action.
 */
export const teamMemberFormSchema = z.object({
  name: teamMemberSchema.shape.name,
  role: teamMemberSchema.shape.role,
  bio: z
    .string("Biographie invalide.")
    .trim()
    .max(400, "Cette biographie est trop longue (400 caractères maximum)."),
  photoMediaId: z.uuid("Cette photo n'existe pas.").nullable(),
}, { message: "Formulaire invalide." });

/** Désigne un membre — suppression, publication, lecture d'une fiche. */
export const teamMemberIdSchema = z.object({
  id: z.uuid("Identifiant de membre invalide."),
}, { message: "Identifiant de membre invalide." });

/** Changement d'état éditorial — publication, dépublication, archivage. */
export const setTeamMemberStatusSchema = z.object({
  id: z.uuid("Identifiant de membre invalide."),
  status: z.enum(CONTENT_STATUSES, { message: "Statut inconnu." }),
}, { message: "Changement d’état invalide." });

/**
 * Réordonnancement.
 *
 * La liste est ENTIÈRE et dans le nouvel ordre — le cas d'usage refuse une
 * liste partielle. Ce schéma ne vérifie que la forme.
 */
export const reorderTeamMembersSchema = z.object({
  orderedIds: z
    .array(z.uuid("Identifiant de membre invalide."), {
      message: "La liste des membres à réordonner est absente.",
    })
    .min(1, "Aucun élément à réordonner."),
}, { message: "Liste de réordonnancement invalide." });

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type CreateTeamMemberInput = z.infer<typeof createTeamMemberSchema>;
export type UpdateTeamMemberInput = z.infer<typeof updateTeamMemberSchema>;
export type TeamMemberFormInput = z.infer<typeof teamMemberFormSchema>;
