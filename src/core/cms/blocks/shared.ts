import { z } from "zod";

import { MEDIA_TONES } from "../entities/media-tone";
import type { FieldDescriptor } from "./types";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES FRAGMENTS PARTAGÉS PAR LES DIX-SEPT BLOCS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Quatorze des dix-sept blocs ouvrent sur le même en-tête de section — badge,
 * titre, sous-titre, alignement — parce que le site public le fait déjà :
 * `<SectionHeading>` est rendu à l'identique sur toutes les pages, et c'est ce
 * qui donne au site sa hiérarchie visuelle constante (voir l'en-tête de
 * `section-heading.tsx`).
 *
 * Recopier ces quatre champs dix-sept fois aurait produit dix-sept messages
 * d'erreur légèrement différents et dix-sept bornes de longueur divergentes. Ce
 * fichier les déclare UNE fois.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUN `.default()`, AUCUN `.optional()` DANS UN SCHÉMA DE BLOC
 * ---------------------------------------------------------------------------
 * C'est la contrainte la plus structurante du lot, et elle vient de loin :
 * `<SchemaForm>` exige `z.ZodType<T, T>` — type d'ENTRÉE identique au type de
 * SORTIE (écarts nº 50, 58, 71 et 86). Un `.default()` ou un `.partial()` rompt
 * l'égalité et le formulaire ne compile plus.
 *
 * La conséquence pratique : **un champ facultatif se représente par une valeur
 * VIDE, pas par une valeur absente.** Un badge non renseigné vaut `""`, une
 * limite non fixée vaut `null`, une liste vide vaut `[]`. Le `Renderer` teste
 * la valeur vide et n'affiche rien — ce qu'il devait faire de toute façon.
 *
 * Le contenu réellement stocké en base peut, lui, être incomplet : les 30
 * sections squelettes du seed portent `{}`. C'est `fusionnerAvecDefauts()` du
 * registre qui comble les manques AVANT la validation, jamais le schéma.
 */

/* ─────────────────────────── En-tête de section ─────────────────────────── */

export const ALIGNEMENTS = ["left", "center"] as const;
export type AlignementBloc = (typeof ALIGNEMENTS)[number];

export const badgeSchema = z
  .string("Le badge doit être du texte.")
  .trim()
  .max(60, "Ce badge est trop long (60 caractères maximum).");

export const titreSchema = z
  .string("Le titre doit être du texte.")
  .trim()
  .max(120, "Ce titre est trop long (120 caractères maximum).");

export const sousTitreSchema = z
  .string("Le sous-titre doit être du texte.")
  .trim()
  .max(300, "Ce sous-titre est trop long (300 caractères maximum).");

export const alignementSchema = z.enum(ALIGNEMENTS, {
  message: "Choisissez un alignement.",
});

/**
 * Fond d'une section : uni, ou légèrement distinct de la page (`bg-card`).
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE CHAMP EXISTE, ET POURQUOI SEULEMENT SUR DEUX BLOCS
 * ---------------------------------------------------------------------------
 * La migration du Lot 9 (§9.5) a révélé que deux sections du site actuel —
 * FAQ et moyens de don — alternent délibérément entre fond uni et `bg-card`
 * SELON LA PAGE : la FAQ de l'accueil porte un fond distinct, celles de `/don`
 * et `/benevolat` non ; les « autres moyens de donner » de `/don`, eux, EN
 * portent un. Un seul choix figé dans le `Renderer` aurait forcément trahi
 * l'une des pages.
 *
 * Les quinze autres blocs n'ont montré AUCUNE variation de ce genre à l'usage
 * réel : leur fond reste une décision du `Renderer`, comme avant. Ce champ
 * n'est donc PAS ajouté partout par précaution — seulement où la migration a
 * démontré qu'il le fallait.
 */
export const FONDS_DE_SECTION = ["default", "surface"] as const;
export type FondDeSection = (typeof FONDS_DE_SECTION)[number];

export const fondSchema = z.enum(FONDS_DE_SECTION, {
  message: "Choisissez un fond.",
});

export function champFond(): FieldDescriptor {
  return {
    kind: "select",
    name: "background",
    label: "Fond de la section",
    options: [
      { value: "default", label: "Uni, comme la page" },
      { value: "surface", label: "Légèrement distinct (carte)" },
    ],
    required: true,
    hint: "Utile pour distinguer visuellement deux sections qui se suivent.",
  };
}

/**
 * Les trois champs d'en-tête, à étendre dans le `z.object` de chaque bloc.
 *
 * Employés par étalement (`...enteteShape`) plutôt que par composition de
 * schémas : `z.object({...enteteShape, …})` produit UN objet plat, là où un
 * `.extend()` sur un schéma partagé aurait fait porter le message d'objet du
 * parent (« En-tête invalide. ») à un bloc entier.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `align` EST À PART, ET LA RECETTE A TRANCHÉ
 * ---------------------------------------------------------------------------
 * Les quatre champs avaient d'abord été réunis, `champsEntete({
 * sansAlignement: true })` se contentant de masquer le champ de saisie pour les
 * cinq blocs qui n'en ont pas l'usage.
 *
 * La recette du lot l'a refusé, et elle avait raison : le schéma continuait
 * d'exiger `align`, les `defaults` continuaient de l'écrire, et la base
 * stockait donc sur cinq blocs une clé que **rien ne peut modifier depuis le
 * dashboard**. Un contenu non saisissable est un contenu qui finit par
 * contredire l'écran — c'est le même défaut que celui de l'écart nº 15,
 * découvert une couche plus haut.
 *
 * Un bloc qui n'aligne rien ne porte donc plus la clé du tout.
 */
export const enteteShape = {
  badge: badgeSchema,
  title: titreSchema,
  subtitle: sousTitreSchema,
};

/** L'en-tête, plus l'alignement, pour les blocs qui l'offrent. */
export const enteteAligneShape = {
  ...enteteShape,
  align: alignementSchema,
};

/** Contenu d'en-tête d'un bloc fraîchement ajouté : tout est vide, rien n'est faux. */
export const DEFAUTS_ENTETE = {
  badge: "",
  title: "",
  subtitle: "",
};

export const DEFAUTS_ENTETE_ALIGNE = {
  ...DEFAUTS_ENTETE,
  align: "left" as AlignementBloc,
};

/**
 * Les descripteurs de champ correspondants.
 *
 * Une FONCTION et non une constante : chaque appel doit rendre un tableau
 * NEUF. Un tableau partagé entre dix-sept définitions serait modifiable par
 * l'une d'elles — un `fields.push()` malheureux dans un écran, et les seize
 * autres blocs gagnent un champ.
 */
export function champsEntete(options?: {
  /** Aide propre au bloc, quand « Titre de la section » ne suffit pas. */
  aideTitre?: string;
  /** Certains blocs n'ont pas d'alignement à offrir (bannière, coordonnées). */
  sansAlignement?: boolean;
}): FieldDescriptor[] {
  const champs: FieldDescriptor[] = [
    {
      kind: "text",
      name: "badge",
      label: "Badge",
      maxLength: 60,
      hint: "Petite étiquette au-dessus du titre. Laissez vide pour ne pas l'afficher.",
      placeholder: "Nos programmes",
    },
    {
      kind: "text",
      name: "title",
      label: "Titre de la section",
      maxLength: 120,
      hint: options?.aideTitre,
    },
    {
      kind: "textarea",
      name: "subtitle",
      label: "Sous-titre",
      maxLength: 300,
      rows: 3,
      hint: "Une phrase d'introduction. Laissez vide pour ne pas l'afficher.",
    },
  ];

  if (!options?.sansAlignement) {
    champs.push({
      kind: "select",
      name: "align",
      label: "Alignement",
      options: [
        { value: "left", label: "À gauche" },
        { value: "center", label: "Centré" },
      ],
      required: true,
    });
  }

  return champs;
}

/* ──────────────────────────── Fragments communs ─────────────────────────── */

export const teinteSchema = z.enum(MEDIA_TONES, {
  message: "Choisissez une teinte.",
});

/**
 * Référence à un média de la médiathèque, ou `null`.
 *
 * ⚠️  `null` et non l'absence : voir l'avertissement en tête de fichier. Une
 * section dont l'image n'est pas encore choisie est un état NORMAL — le
 * `Renderer` rend alors le `<MediaPlaceholder>` de `<CmsImage>`, jamais une
 * image cassée (invariant nº 2 du projet).
 */
export const mediaIdSchema = z
  .uuid("Image invalide : choisissez-la dans la médiathèque.")
  .nullable();

/**
 * Adresse d'un lien interne ou externe, vide quand il n'y en a pas.
 *
 * Volontairement PERMISSIF sur la forme : le site mêle des chemins internes
 * (`/programmes`), des ancres (`#chiffres`), des `mailto:` et des liens
 * externes. Une validation d'URL absolue aurait refusé les trois premiers, qui
 * sont l'usage courant. Le champ `kind: 'link'` de `<SchemaForm>` avertit
 * quand le lien sort du site — c'est là que se joue la mise en garde utile.
 */
export const lienSchema = z
  .string("Le lien doit être du texte.")
  .trim()
  .max(300, "Ce lien est trop long (300 caractères maximum).");

export const libelleLienSchema = z
  .string("Le libellé du lien doit être du texte.")
  .trim()
  .max(60, "Ce libellé est trop long (60 caractères maximum).");

/**
 * Nombre d'éléments affichés par un bloc de collection, `null` pour « tous ».
 *
 * ⚠️  `null` est la valeur PLEINE, pas la valeur vide — l'inverse de l'intuition
 * et l'inverse des autres champs de ce fichier. La case « pas de limite » du
 * champ `kind: 'number'` écrit `null`, et le `Renderer` affiche alors la
 * collection entière. Le libellé de la case le dit explicitement dans chaque
 * bloc concerné, parce que « laisser vide » et « tout afficher » sont deux
 * intentions qu'une case à cocher seule ne distingue pas.
 */
export const limiteSchema = z
  .number("Indiquez un nombre.")
  .int("Indiquez un nombre entier.")
  .min(1, "Affichez au moins un élément.")
  .max(24, "Vingt-quatre éléments au maximum.")
  .nullable();

export function champLimite(
  aide: string,
  libelle = "Nombre d'éléments affichés",
): FieldDescriptor {
  return {
    kind: "number",
    name: "limit",
    label: libelle,
    min: 1,
    max: 24,
    nullable: true,
    hint: aide,
  };
}

/**
 * Paragraphes de texte libre, un par entrée.
 *
 * C'est la forme exacte d'`Actualite.body` (Lot 8B) et du champ
 * `kind: 'richtext'` de `<SchemaForm>` : le formulaire découpe la zone de
 * saisie sur les lignes vides et stocke un tableau. Le `Renderer` rend un
 * `<p>` par entrée — jamais du HTML brut, jamais de `dangerouslySetInnerHTML`.
 */
export const paragraphesSchema = z
  .array(
    z
      .string("Un paragraphe doit être du texte.")
      .trim()
      .max(2000, "Ce paragraphe est trop long (2000 caractères maximum)."),
    { message: "Le texte est invalide." },
  )
  .max(40, "Quarante paragraphes au maximum.");

/** Puces courtes : les listes à points du site (« Présente à Douala… »). */
export const pucesSchema = z
  .array(
    z
      .string("Une puce doit être du texte.")
      .trim()
      .max(300, "Cette puce est trop longue (300 caractères maximum)."),
    { message: "La liste de puces est invalide." },
  )
  .max(12, "Douze puces au maximum.");

/**
 * Le descripteur d'une liste de chaînes simples.
 *
 * `of: [{ kind: 'text', name: '', … }]` — le `name` vide est ce qui bascule
 * `<ListField>` en mode « liste de chaînes » plutôt qu'en liste d'objets
 * (Lot 6). Ce détail n'est écrit nulle part ailleurs : il vaut mieux qu'il ne
 * soit recopié dans aucun bloc.
 */
export function champListeDeTextes(
  name: string,
  label: string,
  itemLabel: string,
  options?: { hint?: string; max?: number; placeholder?: string },
): FieldDescriptor {
  return {
    kind: "list",
    name,
    label,
    itemLabel,
    of: [
      {
        kind: "text",
        name: "",
        label: itemLabel,
        placeholder: options?.placeholder,
      },
    ],
    hint: options?.hint,
    max: options?.max,
  };
}
