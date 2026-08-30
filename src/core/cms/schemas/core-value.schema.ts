import { z } from "zod";

import { ICON_NAMES } from "../entities/icon-name";
import { MEDIA_TONES } from "../entities/media-tone";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION DES VALEURS DE L'ASSOCIATION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagés client et serveur, comme aux Lots 8A à 8D : la validation côté
 * client améliore le confort, celle côté serveur est la seule qui protège —
 * une Server Action est joignable par un POST direct, sans passer par le
 * formulaire.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `icon` EST UN `z.enum`, ET C'EST LA NOUVEAUTÉ DU LOT
 * ---------------------------------------------------------------------------
 * `programme.schema.ts` (Lot 8A) valide son icône par
 * `z.string().trim().min(1, "Choisissez une icône.")` : **n'importe quelle
 * chaîne non vide passe.** Un POST direct portant `icon: "bonjour"` est écrit
 * en base, et la page publique rend l'étoile de repli sans que rien ne le
 * signale. La donnée est fausse, le rendu est plausible : c'est la pire
 * combinaison.
 *
 * L'asymétrie n'avait qu'une cause : `MEDIA_TONES` vivait dans `core/` et la
 * liste des icônes dans `@/components`, où le domaine n'a pas le droit d'aller.
 * Le Lot 8E déplace la liste (`core/cms/entities/icon-name.ts`), ce qui rend
 * enfin les deux champs symétriques :
 *
 *     icon: z.enum(ICON_NAMES, …)      ← nouveau
 *     tone: z.enum(MEDIA_TONES, …)     ← depuis le Lot 8A
 *
 * ⚠️  `programme.schema.ts` PEUT ET DOIT ÊTRE RESSERRÉ DE LA MÊME FAÇON, mais
 * pas ici : corriger le schéma d'un lot livré sans rejouer sa recette ne
 * prouverait rien. Consigné pour le Lot 16, avec les écarts nº 90 et 99.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LES TROIS NIVEAUX DE MESSAGE — champ, longueur, ET objet
 * ---------------------------------------------------------------------------
 * Acquis des Lots 8C et 8D, appliqué d'emblée ici (écarts nº 90 et 99) :
 *
 *   * `z.string("…")` couvre l'erreur de TYPE — sans elle, un champ absent
 *     produit « Invalid input: expected string, received undefined » ;
 *   * `.min(n, "…")` couvre la LONGUEUR — Zod s'arrête au premier échec, il
 *     faut donc les deux ;
 *   * `{ message: "…" }` en second argument de `z.object` couvre la charge
 *     utile qui n'est PAS un objet — `safeParse("bonjour")`, `safeParse(null)`,
 *     `safeParse([])`. Le cas est atteignable : un POST direct n'a aucune
 *     obligation d'envoyer un objet.
 *
 * Le message d'objet se propage aux schémas dérivés — `.omit()`, `.extend()`,
 * `.partial()` le conservent — ce que la recette vérifie sur les sept schémas
 * de ce fichier.
 */

export const coreValueSchema = z.object(
  {
    id: z.uuid("Identifiant de valeur invalide."),
    title: z
      .string("Le titre est obligatoire.")
      .trim()
      .min(2, "Le titre est obligatoire.")
      .max(60, "Ce titre est trop long (60 caractères maximum)."),
    /*
      `description` est OBLIGATOIRE, contrairement à la biographie d'un membre
      de l'équipe (Lot 8D). La colonne est `not null` (migration 0005), et le
      métier dit la même chose : « Solidarité » seul n'est pas une valeur, c'est
      un mot. La carte publique affiche toujours le paragraphe — il n'y a donc
      pas de cas « sans description » à représenter, et pas de `null` à
      distinguer d'une chaîne vide.
    */
    description: z
      .string("L'explication est obligatoire.")
      .trim()
      .min(10, "Expliquez cette valeur en une phrase (10 caractères minimum).")
      .max(200, "Cette explication est trop longue (200 caractères maximum)."),
    icon: z.enum(ICON_NAMES, { message: "Choisissez une icône dans la liste." }),
    tone: z.enum(MEDIA_TONES, { message: "Choisissez une teinte." }),
    position: z.number("Position invalide.").int().min(0),
    isVisible: z.boolean("Visibilité invalide."),
    createdAt: z.string("Date de création invalide."),
    updatedAt: z.string("Date de modification invalide."),
  },
  { message: "Valeur invalide." },
);

/**
 * Création.
 *
 * ⚠️  `isVisible` RESTE dans le contrat, à l'inverse de `status` aux Lots 8C
 * et 8D.
 *
 * Là-bas, le champ avait été retiré pour qu'aucune requête ne puisse créer un
 * contenu déjà en ligne sans traverser la garde de publication. Ici il n'y a
 * pas de garde à traverser : `value:publish` n'existe pas, et créer une valeur
 * visible est le cas NORMAL — c'est même ce que fait la base par défaut. Le
 * retirer aurait imposé deux appels pour l'usage courant, sans rien protéger.
 *
 * `position` reste facultatif : il est calculé, pas décidé.
 */
export const createCoreValueSchema = coreValueSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .extend({
    position: z.number("Position invalide.").int().min(0).optional(),
    isVisible: z.boolean("Visibilité invalide.").default(true),
  });

/** Modification partielle : seuls les champs envoyés sont validés. */
export const updateCoreValueSchema = coreValueSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ id: z.uuid("Identifiant de valeur invalide.") });

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SCHÉMA DU FORMULAIRE — distinct des deux précédents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Troisième schéma, pour la raison des écarts nº 50, 58, 71 et 86 :
 * `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE identique au type de
 * SORTIE. `createCoreValueSchema` porte un `.default(…)` et
 * `updateCoreValueSchema` est `.partial()` : les deux ont entrée ≠ sortie.
 *
 * ⚠️  `isVisible` N'Y FIGURE PAS. Afficher ou retirer du site n'est pas de la
 * saisie : c'est une décision, prise depuis l'en-tête de la fiche ou depuis la
 * liste, avec sa propre entrée d'audit. La mêler aux quatre champs de contenu
 * en aurait fait une case qu'on coche par distraction en corrigeant une faute
 * de frappe — et qui retire la valeur de deux pages publiques.
 */
export const coreValueFormSchema = z.object(
  {
    title: coreValueSchema.shape.title,
    description: coreValueSchema.shape.description,
    icon: coreValueSchema.shape.icon,
    tone: coreValueSchema.shape.tone,
  },
  { message: "Formulaire invalide." },
);

/** Désigne une valeur — suppression, lecture d'une fiche. */
export const coreValueIdSchema = z.object(
  { id: z.uuid("Identifiant de valeur invalide.") },
  { message: "Identifiant de valeur invalide." },
);

/** Affichage ou retrait du site. */
export const setCoreValueVisibilitySchema = z.object(
  {
    id: z.uuid("Identifiant de valeur invalide."),
    isVisible: z.boolean("Visibilité invalide."),
  },
  { message: "Changement de visibilité invalide." },
);

/**
 * Réordonnancement.
 *
 * La liste est ENTIÈRE et dans le nouvel ordre — le cas d'usage refuse une
 * liste partielle. Ce schéma ne vérifie que la forme.
 */
export const reorderCoreValuesSchema = z.object(
  {
    orderedIds: z
      .array(z.uuid("Identifiant de valeur invalide."), {
        message: "La liste des valeurs à réordonner est absente.",
      })
      .min(1, "Aucun élément à réordonner."),
  },
  { message: "Liste de réordonnancement invalide." },
);

export type CoreValueInput = z.infer<typeof coreValueSchema>;
export type CreateCoreValueInput = z.infer<typeof createCoreValueSchema>;
export type UpdateCoreValueInput = z.infer<typeof updateCoreValueSchema>;
export type CoreValueFormInput = z.infer<typeof coreValueFormSchema>;
