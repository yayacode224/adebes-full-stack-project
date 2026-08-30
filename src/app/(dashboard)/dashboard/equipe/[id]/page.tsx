import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { cache } from "react";

import { TeamMemberEditeur } from "@/components/dashboard/team/team-member-editeur";
import { estNomAFournir, type TeamMember } from "@/core/cms/entities/team-member";
import { teamMemberIdSchema } from "@/core/cms/schemas/team-member.schema";
import { can } from "@/core/rbac/policy";
import { getTeamMemberById } from "@/core/use-cases/team-members/get-team-member";
import { requirePermission } from "@/server/dal/session";
import { teamMemberReadPort } from "@/server/deps/team-member.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/equipe/[id]
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * L'IDENTIFIANT EST VALIDÉ AVANT D'ÊTRE ENVOYÉ EN BASE
 * ---------------------------------------------------------------------------
 * Il vient de l'URL, donc de n'importe qui. Sans cette vérification,
 * `/dashboard/equipe/bonjour` produirait une erreur PostgREST 22P02
 * (« invalid input syntax for type uuid ») remontée en écran d'erreur
 * technique, là où la réponse juste est une 404 — la même que pour une fiche
 * réellement supprimée.
 *
 * ---------------------------------------------------------------------------
 * `params` EST UNE PROMESSE (Next.js 16, §15 du Rapport 1)
 * ---------------------------------------------------------------------------
 * `const { id } = await params`. C'est la règle nº 3 des contraintes
 * anti-hallucination, et elle vaut aussi dans `generateMetadata`.
 */

/**
 * La lecture, mémoïsée sur la durée d'UN rendu.
 *
 * `generateMetadata` et la page demandent la même fiche : sans `cache()`,
 * chaque affichage produirait deux requêtes identiques.
 */
const lireMembre = cache(
  async (identifiant: string): Promise<TeamMember | null> => {
    const analyse = teamMemberIdSchema.safeParse({ id: identifiant });
    if (!analyse.success) return null;

    const resultat = await getTeamMemberById(
      await teamMemberReadPort(),
      analyse.data.id,
    );

    if (resultat.ok) return resultat.value;
    // `NOT_FOUND` est un cas normal : un lien rouvert après une suppression.
    // Toute autre erreur est une panne et doit remonter telle quelle.
    if (resultat.error.code === "NOT_FOUND") return null;
    throw resultat.error;
  },
);

export async function generateMetadata(
  props: PageProps<"/dashboard/equipe/[id]">,
): Promise<Metadata> {
  const { id } = await props.params;

  // La garde d'accès protège la DONNÉE, pas seulement l'affichage : sans elle,
  // le titre de l'onglet révélerait le nom d'une personne dont la fiche est en
  // brouillon à un compte non autorisé.
  await requirePermission("team:read");

  const membre = await lireMembre(id);

  if (!membre) return { title: "Fiche introuvable" };

  /*
    « [À COMPLÉTER] » n'est pas un titre d'onglet.

    Avec plusieurs onglets ouverts, trois d'entre eux porteraient exactement le
    même libellé et deviendraient impossibles à distinguer. La fonction, elle,
    différencie les trois fiches du seed — c'est la seule information qu'elles
    portent réellement.
  */
  return {
    title: estNomAFournir(membre.name) ? `Fiche : ${membre.role}` : membre.name,
  };
}

export default async function MembreEquipePage(
  props: PageProps<"/dashboard/equipe/[id]">,
) {
  const { id } = await props.params;
  const actor = await requirePermission("team:read");

  const membre = await lireMembre(id);
  if (!membre) notFound();

  return (
    <TeamMemberEditeur
      membre={membre}
      peutModifier={can(actor, "team:update")}
      peutPublier={can(actor, "team:publish")}
      peutSupprimer={can(actor, "team:delete")}
    />
  );
}
