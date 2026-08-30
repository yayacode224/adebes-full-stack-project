import type { ContentStatus } from "./content-status";

/**
 * Un membre de l'équipe — une personne réelle, nommée sur le site.
 *
 * Reprise du type `MembreEquipe` de `src/content/equipe.ts`, avec les
 * différences imposées par le passage en base :
 *
 *   1. La photo est un identifiant de média, plus un chemin de fichier.
 *      `membrePhoto(id)` disparaît — voir l'en-tête de
 *      `src/components/cards/team-member-card.tsx`.
 *   2. `placeholder` DISPARAÎT. La table n'a pas de colonne équivalente
 *      (migration 0005), exactement comme `testimonials` au Lot 8C. Mais la
 *      conséquence n'est PAS la même : les trois entrées de `equipe.ts`
 *      portent `placeholder: true`, et le badge « Nom et photo à fournir »
 *      était donc réellement affiché sur `/a-propos`. Voir l'écart consigné.
 *   3. `position` apparaît : le tableau TypeScript avait un ordre implicite,
 *      la base le rend explicite et modifiable depuis le dashboard.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `name` PEUT CONTENIR UN MARQUEUR, ET CE N'EST PAS UN NOM
 * ---------------------------------------------------------------------------
 * Le seed du Lot 1 a écrit `[À COMPLÉTER]` dans les trois lignes de
 * `team_members` — la valeur de `TODO` (`src/lib/site-config.ts`), reprise
 * telle quelle du tableau TypeScript, où aucun nom n'était inventé.
 *
 * Ce n'est pas une chaîne comme une autre : c'est l'aveu qu'il n'y a pas de
 * nom. L'afficher sur la page publique reviendrait à publier un gabarit comme
 * s'il s'agissait d'un contenu — précisément ce que l'invariant nº 1 interdit,
 * et sur la page dont l'audit (§4.9) dit qu'elle est un signal de confiance
 * pour un donateur.
 *
 * `estNomAFournir()` ci-dessous existe pour que cette reconnaissance soit
 * écrite UNE fois et vérifiable, plutôt que recopiée dans un cas d'usage et
 * dans un composant, où les deux copies finiraient par diverger.
 */
export type TeamMember = {
  id: string;
  /** Prénom et nom de la personne. Jamais inventé — voir `estNomAFournir`. */
  name: string;
  /** Fonction : direction, coordination des programmes, coordination terrain… */
  role: string;
  /** Une phrase : parcours ou domaine de responsabilité. Facultative. */
  bio: string | null;
  photoMediaId: string | null;
  position: number;
  status: ContentStatus;
  createdAt: string;
  updatedAt: string;
};

/** Champs saisis à la création. Le reste est calculé ou par défaut. */
export type CreateTeamMember = Omit<
  TeamMember,
  "id" | "createdAt" | "updatedAt" | "position" | "status"
> & {
  position?: number;
  status?: ContentStatus;
};

/** Modification partielle. `id` identifie la cible, il n'est jamais modifiable. */
export type UpdateTeamMember = Partial<
  Omit<TeamMember, "id" | "createdAt" | "updatedAt">
>;

/**
 * Les marqueurs qui signifient « ce nom reste à fournir ».
 *
 * ⚠️  `"[À COMPLÉTER]"` doit rester identique à la constante `TODO` de
 * `src/lib/site-config.ts`. Elle n'est pas importée ici : `src/core/` est un
 * domaine pur, et `site-config` est de la configuration d'application. La
 * duplication est assumée, et la recette du Lot 8D vérifie que les deux
 * valeurs coïncident encore.
 *
 * Les trois autres formes couvrent ce qu'une personne tape naturellement à la
 * place d'un nom qu'elle n'a pas. La liste est volontairement COURTE : la
 * garde qu'elle alimente refuse une publication, et un faux positif
 * empêcherait de publier quelqu'un qui s'appelle réellement ainsi. Aucune de
 * ces quatre chaînes n'est un nom possible.
 */
export const MARQUEURS_NOM_A_FOURNIR = [
  "[À COMPLÉTER]",
  "À COMPLÉTER",
  "A COMPLETER",
  "TODO",
] as const;

/**
 * Ce nom est-il un marqueur plutôt qu'un nom ?
 *
 * Comparaison sur la chaîne ENTIÈRE, mise en majuscules et débarrassée de ses
 * espaces de bord — pas une recherche de sous-chaîne. « Todorov » contient
 * « TODO » et est un nom parfaitement réel.
 */
export function estNomAFournir(name: string): boolean {
  const normalise = name.trim().toUpperCase();
  return (MARQUEURS_NOM_A_FOURNIR as readonly string[]).includes(normalise);
}
