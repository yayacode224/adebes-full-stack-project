import { z } from "zod";

import { ICON_NAMES } from "../entities/icon-name";
import { VALEUR_MAX } from "../entities/stat";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SCHÉMAS DE VALIDATION DES CHIFFRES CLÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Partagés client et serveur, comme aux Lots 8A à 8F : la validation côté
 * client améliore le confort, celle côté serveur est la seule qui protège — une
 * Server Action est joignable par un POST direct, sans passer par le
 * formulaire.
 *
 * Messages français aux TROIS niveaux d'emblée (écarts nº 90 et 99) : type,
 * longueur, et objet.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `value` EST LE CHAMP DU LOT, ET SON SCHÉMA DIT TROIS CHOSES
 * ---------------------------------------------------------------------------
 *   1. **`.nullable()`** — `null` est une valeur LÉGITIME, pas une erreur de
 *      saisie. C'est l'invariant nº 1 : « chiffre pas encore disponible » doit
 *      être représentable, sinon la seule façon de le dire est de taper `0`,
 *      qui affirme le contraire.
 *   2. **`z.number("…")` avec un message de TYPE explicite** — sans lui, un
 *      champ laissé vide alors que la case n'est pas cochée produit « Invalid
 *      input: expected number, received undefined », en anglais. Le message
 *      dit les DEUX issues possibles, parce qu'elles le sont vraiment :
 *      indiquer un chiffre, ou cocher la case.
 *   3. **`.max(VALEUR_MAX)`** — la colonne est `integer`. Sans borne, un
 *      chiffre à onze positions échoue en base sur « value out of range »,
 *      message exact et illisible.
 *
 * ⚠️  `.min(0)` refuse un chiffre NÉGATIF, et ce n'est pas une contrainte
 * inventée : ces cartes comptent des bénéficiaires, des projets et des années.
 * Un « −30 » affiché en gros caractères sur l'accueil serait une donnée fausse
 * au sens de l'invariant nº 1, pas une préférence de style. `0`, en revanche,
 * reste accepté — un chiffre réellement nul se dit, et c'est bien pour cela
 * qu'il ne doit pas servir à dire « je ne sais pas ».
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `key` N'EST DANS AUCUN SCHÉMA D'ENTRÉE — voir l'écart nº 124
 * ---------------------------------------------------------------------------
 * Il figure dans `statSchema`, qui décrit l'ENTITÉ telle qu'elle est lue, mais
 * il est retiré de la création (il est dérivé du libellé) et neutralisé à la
 * modification (il est immuable). Le laisser franchissable aurait fait d'un
 * identifiant technique invisible un champ qu'un POST direct peut réécrire,
 * pour aucun bénéfice.
 */

export const statSchema = z.object(
  {
    id: z.uuid("Identifiant de chiffre invalide."),
    key: z
      .string("Identifiant technique invalide.")
      .trim()
      .min(2, "Identifiant technique invalide.")
      .max(50, "Cet identifiant technique est trop long (50 caractères maximum)."),
    label: z
      .string("Le libellé est obligatoire.")
      .trim()
      .min(3, "Le libellé est obligatoire.")
      .max(80, "Ce libellé est trop long (80 caractères maximum)."),
    value: z
      .number(
        "Indiquez un chiffre, ou cochez « Ce chiffre n'est pas encore disponible ».",
      )
      .int("Ce chiffre doit être un nombre entier.")
      .min(0, "Ce chiffre ne peut pas être négatif.")
      .max(VALEUR_MAX, "Ce chiffre est trop grand (2 147 483 647 au maximum).")
      .nullable(),
    /*
      `suffix` est accolé au chiffre SANS espace par `<AnimatedCounter>` : huit
      caractères sont déjà beaucoup, et une chaîne longue casserait la
      typographie de la carte, qui est en très grands caractères.

      `null` et `""` décriraient la même chose avec deux valeurs différentes.
      La base porte `null` ; le formulaire manipule une chaîne — c'est ce que
      rend un `<input>` — et convertit `""` en `null` au moment d'appeler la
      Server Action. La conversion est faite à UN endroit, dans `stat-form.tsx`.
    */
    suffix: z
      .string("Suffixe invalide.")
      .trim()
      .max(8, "Ce suffixe est trop long (8 caractères maximum).")
      .nullable(),
    icon: z.enum(ICON_NAMES, { message: "Choisissez une icône dans la liste." }),
    /*
      La précision affichée sous la carte sur `/impact`. Même traitement `null`
      / `""` que `suffix`.

      Elle est FACULTATIVE, comme les puces du Lot 8F (écart nº 119) et pour la
      même raison : l'exiger obligerait à en inventer une. Mais c'est elle qui
      rend un chiffre vérifiable — d'où l'aide de saisie du formulaire, qui le
      dit plutôt que de l'imposer.
    */
    note: z
      .string("Précision invalide.")
      .trim()
      .max(300, "Cette précision est trop longue (300 caractères maximum).")
      .nullable(),
    toConfirm: z.boolean("Indicateur « à revalider » invalide."),
    position: z.number("Position invalide.").int().min(0),
    isVisible: z.boolean("Visibilité invalide."),
    createdAt: z.string("Date de création invalide."),
    updatedAt: z.string("Date de modification invalide."),
  },
  { message: "Chiffre clé invalide." },
);

/**
 * Création.
 *
 * ⚠️  `key` est OMIS : `createStat` le dérive du libellé (écart nº 124).
 *
 * ⚠️  `isVisible` RESTE dans le contrat, avec `true` par défaut — même
 * raisonnement qu'à l'écart nº 108 : il n'y a pas de garde à forcer ici
 * (`stat:publish` n'existe pas), et la base écrit `is_visible = true` par
 * défaut. Le retirer aurait imposé deux appels pour l'usage courant sans rien
 * protéger.
 *
 * `toConfirm` vaut `false` par défaut : un chiffre qu'on vient de saisir n'est
 * pas « repris de l'ancien site ». Le marquer d'office aurait affiché un
 * avertissement sur une donnée que personne n'a mise en doute.
 *
 * `position` reste facultatif : il est calculé, pas décidé.
 */
export const createStatSchema = statSchema
  .omit({ id: true, key: true, createdAt: true, updatedAt: true })
  .extend({
    position: z.number("Position invalide.").int().min(0).optional(),
    isVisible: z.boolean("Visibilité invalide.").default(true),
    toConfirm: z.boolean("Indicateur « à revalider » invalide.").default(false),
  });

/** Modification partielle : seuls les champs envoyés sont validés. */
export const updateStatSchema = statSchema
  .omit({ id: true, createdAt: true, updatedAt: true })
  .partial()
  .extend({ id: z.uuid("Identifiant de chiffre invalide.") });

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE SCHÉMA DU FORMULAIRE — distinct des deux précédents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Quatrième schéma, pour la raison des écarts nº 50, 58, 71, 86 et 108 :
 * `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE identique au type de
 * SORTIE. `createStatSchema` porte deux `.default(…)` et `updateStatSchema` est
 * `.partial()` : les deux ont entrée ≠ sortie.
 *
 * ⚠️  `suffix` et `note` y sont des CHAÎNES, pas `string | null` : un `<input>`
 * vide rend `""`. La conversion `"" → null` est faite dans `stat-form.tsx`,
 * juste avant l'appel de la Server Action.
 *
 * ⚠️  `value` y reste NULLABLE, et c'est la différence qui compte : la case
 * « pas encore disponible » produit un vrai `null`, qui doit traverser le
 * formulaire sans être converti en quoi que ce soit.
 *
 * ⚠️  `isVisible` N'Y FIGURE PAS (écart nº 108) : retirer un chiffre du site
 * est une décision, pas une saisie. `toConfirm`, en revanche, Y FIGURE — c'est
 * une qualification de la donnée saisie, au même titre que la précision qui
 * l'accompagne, et elle se décide en même temps qu'on tape le chiffre.
 */
export const statFormSchema = z.object(
  {
    label: statSchema.shape.label,
    value: statSchema.shape.value,
    suffix: z
      .string("Suffixe invalide.")
      .trim()
      .max(8, "Ce suffixe est trop long (8 caractères maximum)."),
    icon: statSchema.shape.icon,
    note: z
      .string("Précision invalide.")
      .trim()
      .max(300, "Cette précision est trop longue (300 caractères maximum)."),
    toConfirm: statSchema.shape.toConfirm,
  },
  { message: "Formulaire invalide." },
);

/** Désigne un chiffre — suppression, lecture d'une fiche. */
export const statIdSchema = z.object(
  { id: z.uuid("Identifiant de chiffre invalide.") },
  { message: "Identifiant de chiffre invalide." },
);

/** Affichage ou retrait du site. */
export const setStatVisibilitySchema = z.object(
  {
    id: z.uuid("Identifiant de chiffre invalide."),
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
export const reorderStatsSchema = z.object(
  {
    orderedIds: z
      .array(z.uuid("Identifiant de chiffre invalide."), {
        message: "La liste des chiffres à réordonner est absente.",
      })
      .min(1, "Aucun élément à réordonner."),
  },
  { message: "Liste de réordonnancement invalide." },
);

export type StatInput = z.infer<typeof statSchema>;
export type CreateStatInput = z.infer<typeof createStatSchema>;
export type UpdateStatInput = z.infer<typeof updateStatSchema>;
export type StatFormInput = z.infer<typeof statFormSchema>;
