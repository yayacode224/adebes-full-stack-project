import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/layout/page-header";
import { TeamMemberForm } from "@/components/dashboard/team/team-member-form";
import { requirePermission } from "@/server/dal/session";

/**
 * /dashboard/equipe/nouveau — §8D.
 *
 * `team:create`, et non `team:update` : un éditeur crée et modifie, mais la
 * permission exigée doit être celle de l'action réelle. La Server Action
 * revérifie la même — c'est la deuxième barrière du §9 — et la RLS la
 * troisième.
 *
 * ---------------------------------------------------------------------------
 * UNE FICHE NAÎT TOUJOURS EN BROUILLON
 * ---------------------------------------------------------------------------
 * Comme au Lot 8C, ce n'est pas seulement une prudence éditoriale : c'est ce
 * qui rend applicable la garde sur le nom. `createTeamMemberSchema` ne
 * transporte même pas `status`, et le cas d'usage écrit `'draft'` en dur — de
 * sorte qu'aucune requête, fût-elle celle d'un super administrateur, ne puisse
 * créer une fiche déjà en ligne sans passer par `setTeamMemberStatus`.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE LECTURE AVANT LE RENDU
 * ---------------------------------------------------------------------------
 * C'est le seul écran « nouveau » du Lot 8 qui n'en fait pas : le formulaire
 * n'a pas de champ `reference`, donc aucune liste d'options à fournir
 * (écart nº 40). La page se réduit à sa garde d'accès et à son titre.
 */
export const metadata: Metadata = {
  title: "Nouvelle fiche d'équipe",
};

export default async function NouveauMembreEquipePage() {
  await requirePermission("team:create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nouvelle fiche d'équipe"
        description="La fiche est enregistrée en brouillon. Elle ne sera visible sur la page « Qui sommes-nous » qu'une fois publiée."
      />

      <TeamMemberForm />
    </div>
  );
}
