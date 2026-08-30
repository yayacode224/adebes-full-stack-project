import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { TeamClient } from "@/components/dashboard/team/team-client";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { can } from "@/core/rbac/policy";
import { getMediaByIds } from "@/core/use-cases/media/get-media";
import { listTeamMembers } from "@/core/use-cases/team-members/list-team-members";
import { requirePermission } from "@/server/dal/session";
import { mediaReadPort } from "@/server/deps/media.deps";
import { teamMemberReadPort } from "@/server/deps/team-member.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/equipe
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8D du Rapport 2, sur le gabarit du §8A.3. L'entrée de navigation existait
 * depuis le Lot 5 (`dashboard-navigation.ts`, permission `team:read`) et
 * menait jusqu'ici à une 404 : ce lot lui donne sa destination.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc des ports
 * de LECTURE à `server/deps/`. Le nom `SupabaseTeamMemberRepository`
 * n'apparaît nulle part ici.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire (§15, règle 10 du Rapport 1). Et elle ne doit
 * surtout pas être mise en cache — une fiche publiée il y a dix secondes doit
 * apparaître avec son nouvel état.
 */
export const metadata: Metadata = {
  title: "Équipe",
};

/**
 * Toutes les fiches, brouillons compris.
 *
 * La collection en compte trois et n'a pas vocation à en compter deux cents :
 * `<DataTable>` filtre, trie et pagine en mémoire (§6.1). La borne existe
 * malgré tout — `MAX_PAGE_SIZE` vaut 100 — et c'est elle qui rendrait le
 * problème visible si la collection dérivait un jour.
 */
const TAILLE_PAGE = 100;

export default async function EquipePage() {
  const actor = await requirePermission("team:read");

  const read = await teamMemberReadPort();
  const membres = await listTeamMembers(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "position",
    sortDirection: "asc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a
    aucune fiche » et « on n'a pas pu les lire » ne sont pas la même
    information, et les confondre est exactement ce que l'invariant nº 1
    interdit. Le second appelle « Réessayer », le premier « Créer ».
  */
  if (!membres.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Équipe"
          description="Les personnes qui portent l'association."
        />
        <ErrorState
          title="La liste de l'équipe n'a pas pu être chargée"
          message={membres.error.message}
        />
      </div>
    );
  }

  /*
    Les portraits sont résolus ICI, en une requête, et non par les colonnes du
    tableau : trois vignettes chargées une par une depuis le navigateur, ce
    seraient trois allers-retours après le rendu, et trois cases vides en
    attendant.

    Un échec ne justifie pas d'écran d'erreur — la liste reste lisible sans ses
    vignettes, et la colonne dit alors « aucune photo ».
  */
  const identifiants = membres.value.items
    .map((membre) => membre.photoMediaId)
    .filter((identifiant): identifiant is string => identifiant !== null);

  const medias = await getMediaByIds(await mediaReadPort(), identifiants);

  const photos: Record<string, MediaAsset> = {};
  if (medias.ok) {
    for (const media of medias.value) photos[media.id] = media;
  }

  return (
    <TeamClient
      membres={membres.value.items}
      photos={photos}
      peutCreer={can(actor, "team:create")}
      peutModifier={can(actor, "team:update")}
      peutPublier={can(actor, "team:publish")}
      peutSupprimer={can(actor, "team:delete")}
      peutReordonner={can(actor, "team:reorder")}
    />
  );
}
