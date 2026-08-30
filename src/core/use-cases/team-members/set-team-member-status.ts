import {
  canTransition,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "../../cms/entities/content-status";
import { estNomAFournir, type TeamMember } from "../../cms/entities/team-member";
import type { TeamMemberDeps } from "../../cms/ports/team-member.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Fait passer un membre de l'équipe d'un état à un autre.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  C'EST ICI QUE L'INVARIANT Nº 1 DEVIENT UNE GARDE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Ne rien inventer comme contenu. » Les trois lignes de `team_members`
 * portent `name = '[À COMPLÉTER]'` : le seed du Lot 1 a repris à l'identique
 * `src/content/equipe.ts`, où « les fiches sont des emplacements : aucun nom
 * n'est inventé ».
 *
 * Publier une de ces fiches telle quelle mettrait « [À COMPLÉTER] » en toutes
 * lettres sur `/a-propos`, à l'endroit d'un nom de dirigeant — sur la page
 * dont l'audit (§4.9) dit qu'elle est, pour un donateur, un signal de
 * confiance au moins aussi fort qu'un chiffre d'impact. Ce serait publier un
 * gabarit comme s'il s'agissait d'un contenu.
 *
 * Les deux autres issues ont été écartées :
 *
 *   * inventer un nom est exclu par l'invariant nº 1 ;
 *   * afficher la fiche sans nom laisserait une carte à demi vide, que le
 *     visiteur prendrait pour un défaut d'affichage.
 *
 * Reste à REFUSER la publication et à dire quoi faire. La fiche existe, elle
 * est modifiable, sa photo et sa fonction sont déjà là : il ne manque que le
 * nom, et le message le dit.
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission — ce n'est pas son rôle. Le
 * contrôle d'accès appartient à `createAction` (§6 du Rapport 1), et la base
 * le double avec le trigger `guard_publish` (ADB01). Ici, on ne valide que la
 * cohérence métier de la transition.
 */
export async function setTeamMemberStatus(
  deps: TeamMemberDeps,
  input: { id: string; status: ContentStatus },
): Promise<Result<TeamMember>> {
  const existant = await deps.read.findById(input.id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce membre de l'équipe n'existe plus."));
  }

  // Rejouer la même transition n'est pas une erreur : deux clics sur
  // « Publier », ou deux onglets ouverts, ne doivent pas produire un message
  // d'échec alors que le résultat voulu est déjà atteint.
  if (existant.status === input.status) {
    return ok(existant);
  }

  if (!canTransition(existant.status, input.status)) {
    return err(
      new AppError(
        "VALIDATION",
        `Un contenu « ${CONTENT_STATUS_LABELS[existant.status]} » ne peut pas passer directement à « ${CONTENT_STATUS_LABELS[input.status]} ».`,
      ),
    );
  }

  if (input.status === "published") {
    /*
      Le marqueur d'abord, et avec son propre message.

      Il aurait été plus court de le ranger dans `champsManquants` ci-dessous.
      Ce serait une faute de la même nature qu'au Lot 8C : « le nom est
      manquant » et « le nom est encore le marqueur » ne se corrigent pas de la
      même façon. Le second cas a l'apparence d'un champ rempli — le formulaire
      ne signale rien, le tableau affiche du texte — et un message générique
      enverrait chercher un champ vide qu'on ne trouverait pas.
    */
    if (estNomAFournir(existant.name)) {
      return err(
        new AppError(
          "VALIDATION",
          "Cette fiche ne peut pas être mise en ligne : le nom de la personne est encore « [À COMPLÉTER] ». Remplacez-le par le nom réel — il s'afficherait tel quel sur la page « Qui sommes-nous ».",
        ),
      );
    }

    const manquants = champsManquants(existant);
    if (manquants.length > 0) {
      return err(
        new AppError(
          "VALIDATION",
          `Cette fiche ne peut pas être publiée : il manque ${manquants.join(", ")}.`,
        ),
      );
    }
  }

  return ok(await deps.write.setStatus(existant.id, input.status));
}

/**
 * Ce qu'une fiche doit contenir pour être présentable au public.
 *
 * La photo n'en fait PAS partie : une carte sans portrait reste parfaitement
 * lisible — l'emplacement tenu par `<MediaPlaceholder>` est prévu pour ça — et
 * l'exiger interdirait aujourd'hui de publier la moindre fiche, aucune n'ayant
 * de `photo_media_id`.
 *
 * La biographie non plus : la colonne est nullable en base (migration 0005) et
 * la carte n'affiche le paragraphe que s'il existe.
 */
function champsManquants(membre: TeamMember): string[] {
  const manquants: string[] = [];
  if (!membre.name.trim()) manquants.push("le nom de la personne");
  if (!membre.role.trim()) manquants.push("sa fonction");
  return manquants;
}
