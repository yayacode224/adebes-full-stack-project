import type { IconName } from "./icon-name";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  UN CHIFFRE CLÉ
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Reprise du type `Stat` de `src/content/stats.ts`, avec les différences
 * imposées par le passage en base :
 *
 *   1. `icon` est un NOM (« Users »), plus un composant React. Une table SQL ne
 *      stocke pas de composant. La conversion se fait au rendu, par
 *      `<ContentIcon>` — même pont qu'aux Lots 8A et 8E.
 *   2. `position` apparaît : le tableau TypeScript avait un ordre implicite, la
 *      base le rend explicite et modifiable depuis le dashboard.
 *   3. `isVisible` apparaît. Il n'y a PAS de `status` : c'est le gabarit du
 *      Lot 8E, pas celui des Lots 8A–8D et 8F.
 *   4. `suffix` et `note` sont `string | null` et non `string | undefined` :
 *      les colonnes sont nullables, et `null` est ce que la base rend.
 *
 * ---------------------------------------------------------------------------
 * ⚠️⚠️  `value` EST NULLABLE, ET C'EST L'INVARIANT Nº 1 DU PROJET
 * ---------------------------------------------------------------------------
 * « Aucun chiffre fabriqué : une valeur absente est `NULL`, affichée “—”,
 * jamais `0`. »
 *
 * Ce n'est pas une préférence de présentation, c'est la raison d'être de cette
 * collection. Une association qui vit de la générosité du public ne peut pas
 * annoncer un nombre de bénéficiaires qu'elle n'a pas consolidé — et « 0 »
 * n'est pas une absence de réponse, c'est une réponse, et elle est fausse.
 *
 * La migration 0005 l'écrit déjà en SQL (« Ne jamais ajouter `default 0` ni
 * `not null` sur cette colonne »), et la ligne `beneficiaires` du seed porte
 * `value = NULL` depuis le Lot 1, précisément parce que personne n'a fourni le
 * nombre.
 *
 * ⚠️  LES TROIS ENDROITS OÙ LE `0` PEUT REVENIR PAR ACCIDENT, et ce qui
 * l'empêche :
 *
 *   * **à la saisie** — `NumberField` (Lot 6) et sa case « Ce chiffre n'est pas
 *     encore disponible » ; voir l'écart nº 126, qui corrige le seul endroit où
 *     décocher la case réintroduisait un `0` ;
 *   * **à l'écriture** — `toStatUpdate` distingue `undefined` (« champ non
 *     transmis ») de `null` (« chiffre inconnu »). Un `??` malheureux à cet
 *     endroit écraserait l'un par l'autre en silence ;
 *   * **au rendu** — `<StatCard>` teste `value === null`, jamais la véracité de
 *     `value` : `if (stat.value)` afficherait « — » pour un vrai zéro et
 *     confondrait les deux états.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `key` NE S'AFFICHE NULLE PART SUR LE SITE — voir l'écart nº 124
 * ---------------------------------------------------------------------------
 * C'est un identifiant technique, `not null unique` en base, dérivé du libellé
 * à la création et IMMUABLE ensuite. Aucun visiteur ne le voit ; il n'entre
 * dans aucune adresse. Sa seule fonction est d'être stable, pour qu'un bloc de
 * page (Lot 9) puisse un jour désigner « le chiffre des bénéficiaires » sans
 * dépendre d'un libellé que quelqu'un reformulera.
 */
export type Stat = {
  id: string;
  /**
   * Identifiant technique stable (« beneficiaires »). Dérivé du libellé à la
   * création, jamais modifiable ensuite. Invisible du site public.
   */
  key: string;
  /** Ce que le visiteur lit sous le chiffre : « Bénéficiaires accompagnés ». */
  label: string;
  /**
   * ⚠️  `null` = « chiffre pas encore disponible ». JAMAIS `0` pour dire cela.
   *
   * `0` reste une valeur légitime — un chiffre réellement nul se dit — et c'est
   * exactement pourquoi les deux ne doivent pas être confondus.
   */
  value: number | null;
  /** Accolé au chiffre, sans espace : « + », « % ». `null` s'il n'y en a pas. */
  suffix: string | null;
  /** Nom d'icône du registre — jamais une chaîne libre (écart nº 102). */
  icon: IconName;
  /**
   * Précision affichée sous la carte, sur `/impact` uniquement : source,
   * périmètre, réserve. C'est elle qui rend un chiffre vérifiable.
   */
  note: string | null;
  /**
   * Le chiffre existe mais doit encore être validé par l'association.
   *
   * ⚠️  N'a AUCUN effet sur le rendu public — voir l'écart nº 125. C'est un
   * signal interne, adressé à qui peut agir, pas au visiteur.
   */
  toConfirm: boolean;
  position: number;
  /** Affiché sur le site public. Il n'y a pas d'état intermédiaire. */
  isVisible: boolean;
  createdAt: string;
  updatedAt: string;
};

/**
 * Champs saisis à la création.
 *
 * `isVisible` et `toConfirm` restent facultatifs, comme `CreateCoreValue` et
 * pour la même raison : il n'y a aucune garde de publication à forcer sur cette
 * collection (`stat:publish` n'existe pas), et la base porte les mêmes défauts
 * (`is_visible` à `true`, `to_confirm` à `false`).
 *
 * ⚠️  `key` N'EN FAIT PAS PARTIE : il est dérivé du libellé par
 * `createStat`. L'y laisser aurait invité à l'écrire depuis un formulaire, donc
 * à le rendre modifiable — voir l'écart nº 124.
 */
export type CreateStat = Omit<
  Stat,
  | "id"
  | "key"
  | "createdAt"
  | "updatedAt"
  | "position"
  | "isVisible"
  | "toConfirm"
> & {
  position?: number;
  isVisible?: boolean;
  toConfirm?: boolean;
};

/**
 * Ce que le DÉPÔT reçoit à la création — `CreateStat` plus la clé technique.
 *
 * ⚠️  Deux types plutôt qu'un, et ce n'est pas de la cérémonie : c'est le
 * TYPAGE qui garantit que la clé est calculée au bon étage.
 *
 * `CreateStat` (sans `key`) est le contrat de l'APPELANT — Server Action,
 * formulaire, futur importateur. `CreateStatRow` (avec `key`) est le contrat du
 * DÉPÔT. Entre les deux, un seul chemin : `createStat`, qui dérive la clé du
 * libellé et vérifie son unicité.
 *
 * Une Server Action ne peut donc PAS écrire une clé arbitraire, même par un
 * POST direct : le type ne le permet pas, et il n'existe aucune autre porte
 * vers `write.create`. Le commentaire « ne pas faire ça » aurait été plus court
 * et n'aurait rien empêché.
 */
export type CreateStatRow = CreateStat & { key: string };

/**
 * Modification partielle. `id` identifie la cible, il n'est jamais modifiable.
 *
 * ⚠️  `value?: number | null` PORTE TROIS ÉTATS, ET LES TROIS COMPTENT :
 *
 *   * `undefined` → le champ n'est pas transmis, la base garde sa valeur ;
 *   * `null`      → « ce chiffre n'est pas encore disponible » ;
 *   * un nombre   → le chiffre.
 *
 * Confondre les deux premiers est le bug classique du PATCH ; les confondre
 * ICI transformerait « je n'ai pas touché à ce champ » en « efface ce chiffre »,
 * ou l'inverse. `toStatUpdate` est le seul endroit où la distinction est faite,
 * et elle y est testée.
 */
export type UpdateStat = Partial<Omit<Stat, "id" | "createdAt" | "updatedAt">>;

/**
 * Ce que le site affiche à la place d'un chiffre absent.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CE TIRET VIT DANS LE DOMAINE
 * ---------------------------------------------------------------------------
 * Il était écrit en dur dans `<StatCard>`. Tant qu'un seul composant affichait
 * un chiffre, cela ne se voyait pas. Le Lot 8G en ajoute trois — le tableau du
 * dashboard, l'aperçu du formulaire, la fiche — et un tiret recopié quatre fois
 * est un tiret qui finira par être un « N/A » quelque part.
 *
 * C'est un tiret cadratin (U+2014), pas un trait d'union : c'est le caractère
 * rendu aujourd'hui par la carte publique, et la parité de rendu est un critère
 * de recette des lots 8x.
 */
export const VALEUR_ABSENTE = "—";

/**
 * La mention qui accompagne le tiret, pour dire de quoi il s'agit.
 *
 * Reprise mot pour mot de l'attribut `title` de `<StatCard>` : le rendu public
 * ne change pas, la chaîne descend simplement là où le dashboard peut la lire
 * pour dire la même chose que le site.
 */
export const MENTION_VALEUR_ABSENTE = "Chiffre à fournir par l'association";

/**
 * La borne haute d'un `integer` PostgreSQL.
 *
 * La colonne est `integer` (migration 0005). Sans cette borne côté schéma, un
 * chiffre à onze positions traverse toute la chaîne pour échouer en base sur
 * « value out of range for type integer » — exact, illisible, et affiché à
 * quelqu'un qui n'écrira jamais de SQL. Même raisonnement que l'écart nº 116
 * pour la contrainte `check` sur `topic`.
 */
export const VALEUR_MAX = 2_147_483_647;

/** Ce chiffre a-t-il été fourni ? */
export function chiffreDisponible(stat: Pick<Stat, "value">): boolean {
  return stat.value !== null;
}

/**
 * Le chiffre tel qu'il se lit — « 4 200+ », ou « — ».
 *
 * ⚠️  Le formatage est le MÊME que celui de `<AnimatedCounter>`
 * (`Intl.NumberFormat("fr-FR")`, suffixe accolé sans espace) : le dashboard doit
 * montrer ce que le site montre, sinon la colonne « Chiffre » du tableau et la
 * carte publique finiraient par ne plus dire la même chose sur un séparateur de
 * milliers.
 *
 * Cette fonction n'est PAS appelée par `<StatCard>`, qui a besoin du nombre
 * brut pour l'animer. Les deux se rejoignent sur le format, pas sur le code —
 * la recette le vérifie sur les quatre lignes réelles plutôt que de le supposer.
 */
export function libelleValeur(stat: Pick<Stat, "value" | "suffix">): string {
  if (stat.value === null) return VALEUR_ABSENTE;
  return `${new Intl.NumberFormat("fr-FR").format(stat.value)}${stat.suffix ?? ""}`;
}
