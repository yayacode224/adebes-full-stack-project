import { z } from "zod";

import type { FieldDescriptor } from "@/core/cms/blocks/types";
import { CONTENT_STATUSES, type ContentStatus } from "@/core/cms/entities/content-status";
import { MEDIA_TONES } from "@/core/cms/entities/media-tone";

/**
 * Jeu d'essai du banc de démonstration.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  CES DONNÉES SONT FICTIVES, ET ELLES LE DISENT
 * ---------------------------------------------------------------------------
 * L'invariant nº 1 du projet interdit d'inventer du contenu. La parade n'est
 * pas de recopier de vraies données — un jeu d'essai figé finirait par
 * diverger de la base et par tromper quelqu'un — mais de rendre la fiction
 * évidente : « Élément de démonstration nº 4 » ne peut être confondu avec un
 * programme réel, ni par un relecteur, ni par une capture d'écran égarée.
 *
 * Le banc est supprimé au Lot 16, avec cette page.
 */

export type LigneDemo = {
  id: string;
  titre: string;
  categorie: string;
  status: ContentStatus;
  misAJour: string;
  vues: number | null;
};

const CATEGORIES = ["Éducation", "Santé", "Environnement", "Insertion"] as const;

/**
 * 12 lignes : assez pour exercer la pagination (5 par page → 3 pages), les
 * quatre statuts et le tri, sans noyer la page.
 *
 * `vues` est `null` sur une ligne : c'est le cas que l'invariant nº 1 rend
 * obligatoire — la colonne doit afficher « — », jamais « 0 ».
 */
export const LIGNES_DEMO: LigneDemo[] = Array.from({ length: 12 }, (_, index) => ({
  id: `demo-${index + 1}`,
  titre: `Élément de démonstration nº ${index + 1}`,
  categorie: CATEGORIES[index % CATEGORIES.length]!,
  status: CONTENT_STATUSES[index % CONTENT_STATUSES.length]!,
  // Dates espacées d'un jour, à partir d'une date fixe : un `Date.now()` ici
  // rendrait le rendu serveur et le rendu client différents.
  misAJour: new Date(Date.UTC(2026, 0, 5 + index)).toISOString(),
  vues: index === 3 ? null : (index + 1) * 137,
}));

/* ═══════════════════════════════════════════════════════════════════════════
 * Le formulaire de démonstration — les 11 types de champs
 * ═══════════════════════════════════════════════════════════════════════════ */

export const CHAMPS_DEMO: FieldDescriptor[] = [
  {
    kind: "text",
    name: "titre",
    label: "Titre",
    required: true,
    maxLength: 80,
    hint: "Affiché en tête de la fiche sur le site public.",
    placeholder: "Ex. : Cantines scolaires",
  },
  {
    kind: "select",
    name: "statut",
    label: "État de publication",
    required: true,
    options: [
      { value: "draft", label: "Brouillon" },
      { value: "in_review", label: "À relire" },
      { value: "published", label: "En ligne" },
      { value: "archived", label: "Archivé" },
    ],
  },
  {
    kind: "link",
    name: "lien",
    label: "Adresse de la page",
    hint: "Laissez vide pour utiliser l'adresse générée automatiquement.",
  },
  {
    kind: "number",
    name: "ordre",
    label: "Position dans la liste",
    min: 1,
    max: 99,
  },
  {
    kind: "number",
    name: "beneficiaires",
    label: "Bénéficiaires",
    nullable: true,
    unit: "personnes",
    hint: "Laissez « pas encore disponible » tant que le chiffre n'est pas confirmé.",
  },
  {
    kind: "boolean",
    name: "miseEnAvant",
    label: "Mettre en avant sur la page d'accueil",
  },
  { kind: "icon", name: "icone", label: "Icône" },
  { kind: "tone", name: "teinte", label: "Teinte de la carte" },
  {
    kind: "textarea",
    name: "resume",
    label: "Résumé",
    rows: 3,
    maxLength: 200,
    hint: "Une à deux phrases, reprises dans les listes et les partages.",
  },
  {
    kind: "richtext",
    name: "corps",
    label: "Texte de présentation",
  },
  {
    kind: "media",
    name: "image",
    label: "Photo principale",
    accept: "image",
  },
  {
    kind: "list",
    name: "actions",
    label: "Actions menées",
    itemLabel: "action",
    max: 8,
    of: [{ kind: "text", name: "", label: "Action" }],
  },
  {
    kind: "reference",
    name: "programmesLies",
    label: "Programmes associés",
    resource: "programme",
    multiple: true,
  },
];

/* ═══════════════════════════════════════════════════════════════════════════
 * Le schéma — le MÊME que celui qu'une Server Action rejouerait
 * ═══════════════════════════════════════════════════════════════════════════ */

export const schemaDemo = z.object({
  titre: z
    .string()
    .trim()
    .min(3, "Le titre est obligatoire (3 caractères minimum).")
    .max(80, "Le titre est trop long (80 caractères maximum)."),

  statut: z.enum(CONTENT_STATUSES, {
    message: "Choisissez un état de publication.",
  }),

  lien: z
    .string()
    .trim()
    .refine(
      (valeur) => valeur === "" || valeur.startsWith("/") || /^https?:\/\//i.test(valeur),
      { message: "L'adresse doit commencer par « / » ou par « https:// »." },
    ),

  ordre: z
    .number({ message: "Indiquez une position." })
    .int("La position doit être un nombre entier.")
    .min(1, "La position commence à 1.")
    .max(99, "La position ne peut pas dépasser 99."),

  /*
    `null` est une valeur VALIDE, pas une absence tolérée : c'est ce qui permet
    d'enregistrer « on ne connaît pas ce chiffre » sans écrire un zéro faux.
  */
  beneficiaires: z
    .number()
    .int("Le nombre de bénéficiaires doit être un nombre entier.")
    .min(0, "Le nombre de bénéficiaires ne peut pas être négatif.")
    .nullable(),

  miseEnAvant: z.boolean(),

  icone: z.string().min(1, "Choisissez une icône."),

  teinte: z.enum(MEDIA_TONES, { message: "Choisissez une teinte." }),

  resume: z
    .string()
    .trim()
    .max(200, "Le résumé est trop long (200 caractères maximum.)"),

  corps: z
    .array(z.string().trim().min(1))
    .min(1, "Écrivez au moins un paragraphe."),

  image: z.string().nullable(),

  actions: z
    .array(
      z
        .string()
        .trim()
        .min(1, "Cette ligne est vide : renseignez-la ou supprimez-la.")
        .max(200, "Cette ligne est trop longue (200 caractères maximum)."),
    )
    .max(8, "Pas plus de 8 actions."),

  programmesLies: z.array(z.string()),
});

export type ValeursDemo = z.infer<typeof schemaDemo>;

export const VALEURS_DEMO: ValeursDemo = {
  titre: "",
  statut: "draft",
  lien: "",
  ordre: 1,
  beneficiaires: null,
  miseEnAvant: false,
  icone: "",
  teinte: "neutral",
  resume: "",
  corps: [],
  image: null,
  actions: ["Première action de démonstration"],
  programmesLies: [],
};

/**
 * Options du champ `reference`.
 *
 * Fournies par l'écran, comme le prévoit `references-context.tsx` : au Lot 6
 * il n'existe aucun point de lecture pour les charger.
 */
export const REFERENCES_DEMO = {
  programme: [
    { value: "demo-1", label: "Programme de démonstration A", detail: "En ligne" },
    { value: "demo-2", label: "Programme de démonstration B", detail: "Brouillon" },
    { value: "demo-3", label: "Programme de démonstration C", detail: "À relire" },
  ],
};
