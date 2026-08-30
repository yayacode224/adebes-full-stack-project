import type { ListFilter } from "../../shared/pagination";
import type { ContentStatus } from "../entities/content-status";
import type {
  CreateTeamMember,
  TeamMember,
  UpdateTeamMember,
} from "../entities/team-member";

/**
 * Ports du membre de l'équipe — la frontière entre le domaine et la
 * persistance.
 *
 * Même découpage lecture / écriture qu'aux Lots 8A à 8C (principe I de
 * SOLID) : une lecture publique reçoit un `TeamMemberReadPort` et rien
 * d'autre. Elle ne peut pas écrire — pas par convention, mais parce que le
 * type ne le permet pas.
 *
 * ---------------------------------------------------------------------------
 * CE SONT LES PORTS LES PLUS COURTS DU LOT 8
 * ---------------------------------------------------------------------------
 * Et ce n'est pas un oubli. `team_members` n'a AUCUNE clé étrangère sortante
 * hormis la photo, et aucune entrante : rien ne référence un membre de
 * l'équipe. Il n'y a donc ni `findBySlug` (pas de page dédiée, comme au Lot
 * 8C), ni `countByX` (personne à prévenir avant une suppression), ni port
 * étranger dans `TeamMemberDeps`.
 *
 * `reorder` est bien là : `team_members` porte une colonne `position`
 * (migration 0005) et figure dans la liste blanche de `reorder_rows`
 * (migration 0012).
 */

export interface TeamMemberReadPort {
  findAll(filter?: ListFilter): Promise<TeamMember[]>;
  findById(id: string): Promise<TeamMember | null>;
  count(filter?: ListFilter): Promise<number>;
  /**
   * Les membres publiés, dans l'ordre d'affichage.
   *
   * Séparé de `findAll({ status: 'published' })` pour la même raison qu'aux
   * Lots 8B et 8C : la règle d'affichage public est UNE règle, et elle vit
   * dans le dépôt plutôt que d'être recopiée par chaque appelant.
   */
  findPublished(limit?: number): Promise<TeamMember[]>;
}

export interface TeamMemberWritePort {
  create(input: CreateTeamMember): Promise<TeamMember>;
  update(id: string, input: UpdateTeamMember): Promise<TeamMember>;
  delete(id: string): Promise<void>;
  /** Réordonne en UNE transaction — `reorder_rows()` en RPC (§3.4). */
  reorder(orderedIds: string[]): Promise<void>;
  setStatus(id: string, status: ContentStatus): Promise<TeamMember>;
}

/**
 * Regroupement de confort pour les cas d'usage qui écrivent.
 *
 * Deux champs seulement, là où `TestimonialDeps` en avait trois : aucun
 * identifiant étranger n'est à vérifier avant d'écrire. La photo est le seul
 * lien sortant, et sa contrainte est `on delete set null` — un média supprimé
 * détache la photo, il ne casse rien.
 */
export type TeamMemberDeps = {
  read: TeamMemberReadPort;
  write: TeamMemberWritePort;
};
