import type { TeamMember } from "../../cms/entities/team-member";
import type { TeamMemberReadPort } from "../../cms/ports/team-member.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Récupère un membre de l'équipe par son identifiant — écran d'édition du
 * dashboard.
 *
 * Il n'existe pas de `getTeamMemberBySlug` : un membre n'a pas d'adresse
 * publique. C'est la deuxième collection du Lot 8 dans ce cas, après les
 * témoignages, et c'est aussi pourquoi sa fiche n'offre pas de bouton « Voir
 * sur le site » pointant vers une page dédiée.
 */
export async function getTeamMemberById(
  read: TeamMemberReadPort,
  id: string,
): Promise<Result<TeamMember>> {
  const membre = await read.findById(id);
  if (!membre) {
    return err(new AppError("NOT_FOUND", "Ce membre de l'équipe n'existe plus."));
  }
  return ok(membre);
}
