import type { z } from "zod";

import type { Resource } from "../../rbac/permissions";
import type { BlockCategory, BlockType } from "../entities/block-type";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LE DESCRIPTEUR DE CHAMP — ce qui rend `<SchemaForm>` possible
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10 du Rapport 1. C'est la pièce qui fait qu'aucun formulaire d'édition
 * n'est écrit à la main dans ce projet : un bloc à douze champs coûte douze
 * lignes de déclaration, pas trois cents lignes de JSX.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE FICHIER EST LIVRÉ AU LOT 6 ET NON AU LOT 9
 * ---------------------------------------------------------------------------
 * Le §10 le range dans `core/cms/blocks/`, dossier du registre de blocs
 * (Lot 9). Mais `<SchemaForm>` est livré ici, et il ne peut pas exister sans
 * son contrat d'entrée. Le fichier est donc créé maintenant, avec la seule
 * partie qui ne dépend pas du registre. Le Lot 9 y ajoutera `BlockType`,
 * `BlockDescriptor` et `registry.ts`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AVERTISSEMENT POUR LE LOT 9 : `BlockDescriptor` NE PEUT PAS VIVRE ICI
 * ---------------------------------------------------------------------------
 * Le §10 le déclare avec `icon: LucideIcon` et
 * `Renderer: ComponentType<{ content }>`. Ces deux types viennent de React et
 * de lucide-react, que `core/` a interdiction d'importer — règle de dépendance
 * du §4, vérifiée par ESLint (`no-restricted-imports` sur `src/core/**`).
 *
 * Le partage devra donc se faire comme pour `MediaTone` (écart nº 6) :
 * la partie sans rendu (`type`, `label`, `description`, `category`, `schema`,
 * `defaults`, `fields`) reste dans `core/`, et la partie de présentation
 * (`icon`, `Renderer`) vit dans `src/components/blocks/`, les deux étant
 * assemblées par un registre côté présentation. Ne pas découvrir ce mur en
 * plein Lot 9.
 */

/**
 * Un champ du formulaire généré.
 *
 * Union discriminée par `kind` : ajouter un type de champ, c'est ajouter une
 * branche ici **et** un composant dans `components/dashboard/forms/fields/`.
 * TypeScript signale la branche manquante — l'exhaustivité n'est pas une
 * question de discipline.
 */
export type FieldDescriptor =
  | {
      kind: "text";
      name: string;
      label: string;
      required?: boolean;
      maxLength?: number;
      hint?: string;
      placeholder?: string;
    }
  | {
      kind: "textarea";
      name: string;
      label: string;
      required?: boolean;
      maxLength?: number;
      rows?: number;
      hint?: string;
      placeholder?: string;
    }
  | {
      kind: "richtext";
      name: string;
      label: string;
      required?: boolean;
      hint?: string;
    }
  | {
      kind: "number";
      name: string;
      label: string;
      min?: number;
      max?: number;
      /**
       * Autorise `null` — et le rend ATTEIGNABLE par une case à cocher
       * « pas encore disponible ».
       *
       * C'est l'invariant nº 1 du projet rendu saisissable : sans cette case,
       * la seule façon de dire « on ne connaît pas ce chiffre » serait de
       * taper `0`, qui affirme le contraire.
       */
      nullable?: boolean;
      hint?: string;
      /** Unité affichée à droite du champ : « bénéficiaires », « % », « ans ». */
      unit?: string;
    }
  | { kind: "boolean"; name: string; label: string; hint?: string }
  | {
      /**
       * ✚ AJOUT AU TYPE DU §10 — tranché au début du Lot 8B.
       *
       * Le §10 ne prévoit aucun champ de date, alors que le §8B en exige un :
       * « date de publication saisissable dans le passé **et** dans le futur ».
       * Aucun `kind` existant ne convenait :
       *
       *   * `text` aurait laissé saisir « la semaine dernière », que rien ne
       *     sait convertir en instant — et perdu le sélecteur natif, seul
       *     moyen praticable de choisir une date au téléphone ;
       *   * `number` n'a pas de sens ici.
       *
       * La valeur du champ est un **instant ISO**, `null` quand la date n'est
       * pas fixée. La conversion depuis et vers la valeur du `<input>` passe
       * par `src/lib/dates.ts`, qui fixe le fuseau éditorial du site — sans
       * quoi une date saisie « le 20 » s'afficherait « le 19 » sur un serveur
       * en UTC.
       *
       * Le Lot 8I (rapports annuels, millésime) et le Lot 12 (publication
       * programmée) sont les appelants suivants prévus.
       */
      kind: "date";
      name: string;
      label: string;
      required?: boolean;
      /** Autorise l'absence de date, par une case à cocher explicite. */
      nullable?: boolean;
      hint?: string;
    }
  | {
      kind: "select";
      name: string;
      label: string;
      options: { value: string; label: string }[];
      required?: boolean;
      hint?: string;
    }
  | {
      kind: "media";
      name: string;
      label: string;
      accept: "image" | "document" | "video";
      required?: boolean;
      hint?: string;
      /**
       * ✚ AJOUT AU TYPE DU §10 — tranché au début du Lot 8A.
       *
       * Le §10 donne `multiple` à `reference` mais pas à `media`, et le §8A.2
       * déclare pourtant `galleryMediaIds` comme un champ « media multiple ».
       * Sans ce drapeau, la galerie d'un programme n'était pas exprimable :
       * il aurait fallu soit un douzième `kind` propre à la galerie, soit un
       * formulaire écrit à la main — c'est-à-dire l'inverse de ce que ce
       * descripteur existe pour éviter.
       *
       * La valeur du champ suit le drapeau : `string | null` en simple,
       * `string[]` en multiple. C'est la même règle que `reference`, et elle
       * évite qu'un même `kind` produise tantôt un tableau tantôt une chaîne
       * selon le contexte.
       *
       * Le Lot 8H (galerie) est le second appelant prévu.
       */
      multiple?: boolean;
      /** Borne haute en mode multiple. Le schéma Zod la double côté serveur. */
      max?: number;
    }
  | {
      kind: "link";
      name: string;
      label: string;
      required?: boolean;
      hint?: string;
    }
  | { kind: "icon"; name: string; label: string; required?: boolean; hint?: string }
  | { kind: "tone"; name: string; label: string; required?: boolean; hint?: string }
  | {
      kind: "list";
      name: string;
      label: string;
      /** Nom d'un élément au singulier : « action », « public », « besoin ». */
      itemLabel: string;
      /**
       * Champs d'un élément.
       *
       * Une liste de chaînes simples se déclare avec un seul descripteur
       * `text` — c'est le cas de `actions[]`, `publics[]`, `besoins[]` et
       * `bullets[]` du contenu actuel.
       */
      of: FieldDescriptor[];
      required?: boolean;
      hint?: string;
      max?: number;
    }
  | {
      kind: "reference";
      name: string;
      label: string;
      resource: Resource;
      multiple?: boolean;
      required?: boolean;
      hint?: string;
    };

export type FieldKind = FieldDescriptor["kind"];

/**
 * Les champs qui occupent toujours la largeur entière du formulaire.
 *
 * §6.2 : deux colonnes au maximum à partir de `lg:`, mais un `textarea`, un
 * texte riche ou une liste ordonnable sur une demi-largeur devient illisible.
 * La règle est déclarée ici plutôt que répétée dans chaque écran : un champ
 * long le reste quel que soit le formulaire qui l'accueille.
 */
export const CHAMPS_PLEINE_LARGEUR: readonly FieldKind[] = [
  "textarea",
  "richtext",
  "list",
  "media",
  /*
    ✚ AJOUTÉ AU LOT 8C.

    Le §6.2 énumère « textarea, richtext, list » ; `media` avait déjà rejoint
    la liste au Lot 6. `reference` manquait, et cela ne s'était pas vu : aucun
    écran livré n'en portait avant les témoignages.

    Un champ `reference` n'est pas une entrée d'une ligne : c'est un champ de
    recherche SUIVI d'une liste défilante de 224 px. Sur une demi-colonne, à
    partir de `lg:`, les libellés des options — « Développement communautaire »,
    « Autonomisation des femmes » — sont tronqués un par un, ce qui rend le
    choix impossible à faire de mémoire. La règle du §6.2 s'applique donc :
    un champ long prend la largeur entière.
  */
  "reference",
];

export function estPleineLargeur(champ: FieldDescriptor): boolean {
  return CHAMPS_PLEINE_LARGEUR.includes(champ.kind);
}

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA MOITIÉ DOMAINE DU DESCRIPTEUR DE BLOC — Lot 9
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * L'avertissement posé au Lot 6 en haut de ce fichier est ici honoré, sans
 * détour : le §10 déclare `BlockDescriptor` avec `icon: LucideIcon` et
 * `Renderer: ComponentType`, deux types que la règle de dépendance interdit à
 * `core/`. Le descripteur est donc coupé en deux, comme `MediaTone` (écart
 * nº 6) et comme la liste d'icônes (écart du Lot 8E) :
 *
 *   * **ici**, `BlockDefinition` — ce qu'un bloc EST : son identité, son
 *     schéma, ses valeurs par défaut, ses champs de saisie. Testable sans
 *     React, sans navigateur, sans base ;
 *   * **dans `src/components/blocks/registry.tsx`**, `BlockPresentation` —
 *     comment un bloc se DESSINE : son icône dans le sélecteur, son `Renderer`
 *     sur le site public.
 *
 * Le registre de présentation se déclare `Record<BlockType, …>` : **ajouter un
 * bloc ici sans ajouter son rendu là-bas casse la compilation.** C'est le même
 * verrou que celui d'`ICON_NAMES` / `ICONS`, et c'est ce qui rend la coupure
 * sûre plutôt que dangereuse.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `schema` VALIDE À L'ÉCRITURE **ET** À LA LECTURE
 * ---------------------------------------------------------------------------
 * C'est la troisième propriété du §10, et la seule qui protège la production :
 * `page_sections.content` est du JSONB, donc une colonne sans forme. Un contenu
 * écrit par une version antérieure du schéma, ou modifié à la main dans le SQL
 * Editor, arrive tel quel au rendu. `SectionRenderer` le repasse par ce schéma
 * et n'affiche rien s'il ne passe pas — plutôt qu'une page blanche en
 * production (§16 du Rapport 1).
 */
export type BlockDefinition<S extends z.ZodType = z.ZodType> = {
  type: BlockType;
  /** Libellé humain : « Bannière d'appel à l'action ». Jamais le `type`. */
  label: string;
  /** Aide du sélecteur de blocs. Dit ce que le bloc AFFICHE, pas comment. */
  description: string;
  category: BlockCategory;
  /** Validation du contenu JSONB, à l'écriture comme à la lecture. */
  schema: S;
  /** Contenu d'un bloc fraîchement ajouté. Doit satisfaire `schema`. */
  defaults: z.infer<S>;
  /** Pilote le formulaire généré par `<SchemaForm>`. Jamais de JSX. */
  fields: FieldDescriptor[];
  /**
   * Le bloc lit une collection gérée ailleurs dans le dashboard.
   *
   * ⚠️  Ce drapeau ne change rien au rendu : il change ce que l'ÉCRAN DIT.
   * Un « Grille de programmes » vide ne se répare pas en remplissant son
   * formulaire — il n'a pas de contenu propre à remplir — mais en publiant un
   * programme depuis `/dashboard/programmes`. Sans cette indication, la seule
   * conclusion possible devant une section vide est « le bloc est cassé ».
   *
   * La valeur est le libellé de la destination, telle qu'elle apparaît dans la
   * navigation du dashboard : « Programmes », « Actualités », « Chiffres clés ».
   */
  collection?: string;
};
