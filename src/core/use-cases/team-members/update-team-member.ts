import {
  estNomAFournir,
  type TeamMember,
  type UpdateTeamMember,
} from "../../cms/entities/team-member";
import type { TeamMemberDeps } from "../../cms/ports/team-member.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Modifie un membre de l'équipe.
 *
 * Ne change PAS le statut : c'est `setTeamMemberStatus` qui s'en charge, parce
 * que la transition obéit à des règles propres et exige une autre permission.
 * Un cas d'usage, une intention (§7 du Rapport 1).
 *
 * L'identifiant est un paramètre distinct de la charge utile : il désigne la
 * cible, il n'en fait pas partie.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA PORTE DE DERRIÈRE, FERMÉE ICI COMME AU LOT 8C
 * ---------------------------------------------------------------------------
 * `setTeamMemberStatus` refuse de publier un membre dont le nom est encore le
 * marqueur « [À COMPLÉTER] ». Sans la garde ci-dessous, il suffirait de
 * publier une fiche nommée correctement, puis de REMPLACER le nom par le
 * marqueur : la page `/a-propos` afficherait « [À COMPLÉTER] » sur la page
 * même dont l'audit (§4.9) dit qu'elle est un signal de confiance pour un
 * donateur, sans qu'aucune règle n'ait été enfreinte au sens strict.
 *
 * C'est le pendant exact de la règle du Lot 8C sur la réécriture d'une
 * citation publiée sans accord, et l'issue retenue est la même — la
 * troisième :
 *
 *   1. l'accepter en silence — la pire : le site affiche un gabarit ;
 *   2. dépublier automatiquement — ce serait changer le statut depuis un cas
 *      d'usage de modification, ce que le projet interdit partout ailleurs, et
 *      donner à un éditeur (`team:update`) le moyen de retirer un contenu du
 *      site sans avoir `team:publish` ;
 *   3. REFUSER, et dire quoi faire.
 *
 * Sur un BROUILLON, remettre le marqueur reste permis : c'est même la façon
 * honnête de dire « ce nom était provisoire, il reste à fournir ».
 */
export async function updateTeamMember(
  deps: TeamMemberDeps,
  id: string,
  input: UpdateTeamMember,
): Promise<Result<TeamMember>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce membre de l'équipe n'existe plus."));
  }

  if (
    existant.status === "published" &&
    input.name !== undefined &&
    estNomAFournir(input.name)
  ) {
    return err(
      new AppError(
        "VALIDATION",
        "Cette fiche est en ligne : « [À COMPLÉTER] » s'afficherait tel quel sur la page « Qui sommes-nous ». Retirez la fiche du site avant d'y remettre ce marqueur.",
        {
          name: "Dépubliez la fiche avant de remettre ce marqueur à la place du nom.",
        },
      ),
    );
  }

  // Le statut est neutralisé plutôt qu'ignoré silencieusement : un formulaire
  // qui renverrait l'entité complète ne doit pas publier par effet de bord.
  // Les repositories ne transmettent pas les champs `undefined`.
  const champs: UpdateTeamMember = { ...input, status: undefined };

  return ok(await deps.write.update(existant.id, champs));
}
