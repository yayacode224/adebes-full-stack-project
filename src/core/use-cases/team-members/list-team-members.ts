import type { TeamMember } from "../../cms/entities/team-member";
import type { TeamMemberReadPort } from "../../cms/ports/team-member.port";
import {
  normalizeFilter,
  toPage,
  type ListFilter,
  type Page,
} from "../../shared/pagination";
import { ok, type Result } from "../../shared/result";

/**
 * Liste paginée des membres de l'équipe, pour le dashboard.
 *
 * ⚠️  Ne reçoit qu'un `TeamMemberReadPort` — pas les deux. Une lecture ne peut
 * structurellement pas écrire (§7 du Rapport 1, principe I).
 */
export async function listTeamMembers(
  read: TeamMemberReadPort,
  filter: ListFilter = {},
): Promise<Result<Page<TeamMember>>> {
  const normalise = normalizeFilter(filter);
  const [items, total] = await Promise.all([
    read.findAll(normalise),
    read.count(normalise),
  ]);
  return ok(toPage(items, total, normalise));
}

/**
 * Membres publiés, dans l'ordre d'affichage — ce que voit le site public.
 *
 * Le filtrage par statut est répété dans le dépôt alors que la RLS l'impose
 * déjà à la clé `anon` : les deux barrières sont indépendantes, et cette
 * fonction doit rester correcte même appelée avec un client authentifié.
 *
 * ⚠️  ELLE NE FILTRE PAS SUR LE MARQUEUR « [À COMPLÉTER] », et c'est
 * délibéré : une fiche portant encore le marqueur ne peut pas ÊTRE publiée
 * (`setTeamMemberStatus`), donc elle n'atteint jamais cette lecture. Ajouter
 * ici un second filtre donnerait l'illusion d'une défense en profondeur, alors
 * qu'il masquerait en silence un état devenu impossible — et masquer plutôt
 * que signaler est exactement ce que le Lot 8C a refusé de faire.
 */
export async function listPublishedTeamMembers(
  read: TeamMemberReadPort,
  limit = 100,
): Promise<Result<TeamMember[]>> {
  return ok(await read.findPublished(limit));
}
