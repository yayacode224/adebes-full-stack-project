import type {
  CreateTeamMember,
  TeamMember,
} from "../../cms/entities/team-member";
import type { TeamMemberDeps } from "../../cms/ports/team-member.port";
import { ok, type Result } from "../../shared/result";

/**
 * Crée un membre de l'équipe.
 *
 * Deux règles, et rien d'autre : ce fichier ne sait ni ce qu'est une requête
 * HTTP, ni ce qu'est Supabase. Il se teste avec un dépôt en mémoire.
 *
 * ---------------------------------------------------------------------------
 * NI SLUG, NI IDENTIFIANT ÉTRANGER À VÉRIFIER
 * ---------------------------------------------------------------------------
 * C'est le cas d'usage de création le plus court du Lot 8, et c'est la
 * conséquence directe de la forme de la table : `team_members` n'a pas
 * d'adresse publique (comme les témoignages) et ne référence rien d'autre
 * qu'un média, dont la contrainte est `on delete set null`.
 *
 * Deux homonymes sont donc acceptés. Refuser un doublon de nom serait inventer
 * une contrainte que ni la base ni le métier ne portent — et une association
 * peut parfaitement compter deux personnes portant le même nom.
 */
export async function createTeamMember(
  deps: TeamMemberDeps,
  input: CreateTeamMember,
): Promise<Result<TeamMember>> {
  // 1. Le nouveau membre se place en fin de liste. `count()` plutôt qu'un
  //    `max(position) + 1` : les positions sont renumérotées de 1 à N à chaque
  //    réordonnancement, les deux valeurs coïncident donc toujours.
  const position = input.position ?? (await deps.read.count()) + 1;

  return ok(
    await deps.write.create({
      ...input,
      position,
      /*
        2. Un membre naît TOUJOURS en brouillon.

        `'draft'` en dur, et non `input.status ?? 'draft'` comme aux Lots 8A et
        8B : la valeur reçue est ignorée, quelle qu'elle soit. C'est ce qui
        garantit que toute mise en ligne traverse `setTeamMemberStatus`, seul
        endroit où l'on vérifie que le nom affiché en est un et non le marqueur
        « [À COMPLÉTER] ». Le schéma de création ne transporte déjà plus
        `status`, mais ce cas d'usage est aussi appelable depuis un test ou un
        futur importateur, et la règle ne doit pas dépendre de qui appelle.
      */
      status: "draft",
    }),
  );
}
