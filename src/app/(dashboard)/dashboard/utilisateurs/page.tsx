import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { UsersClient } from "@/components/dashboard/users/users-client";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { can } from "@/core/rbac/policy";
import { getMediaByIds } from "@/core/use-cases/media/get-media";
import { listUserAccounts } from "@/core/use-cases/users/list-user-accounts";
import { requirePermission } from "@/server/dal/session";
import { mediaReadPort } from "@/server/deps/media.deps";
import { userAccountReadPort } from "@/server/deps/user-account.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/utilisateurs (§13.1 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * L'entrée de navigation existe depuis le Lot 5 (`dashboard-navigation.ts`,
 * permission `user:read`, groupe « Administration ») et menait jusqu'ici au
 * fourre-tout `[...segments]`. Ce lot lui donne sa destination.
 *
 * Lecture AUTHENTIFIÉE : pas de `'use cache'` — l'annuaire dépend des cookies
 * (RLS `profiles_admin_read`) et ne doit jamais être servi périmé.
 */
export const metadata: Metadata = {
  title: "Utilisateurs",
};

export default async function UtilisateursPage() {
  const actor = await requirePermission("user:read");

  const comptes = await listUserAccounts(await userAccountReadPort());

  if (!comptes.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Utilisateurs"
          description="Les comptes qui accèdent au dashboard."
        />
        <ErrorState
          title="L'annuaire n'a pas pu être chargé"
          message={comptes.error.message}
        />
      </div>
    );
  }

  /*
    Les avatars sont résolus ICI, en une requête, comme les portraits de
    l'équipe (§8D) : une vignette par ligne chargée depuis le navigateur, ce
    seraient autant d'allers-retours après le rendu. Un échec ne justifie pas
    d'écran d'erreur — la liste reste lisible, l'avatar retombe sur les
    initiales.
  */
  const identifiants = comptes.value
    .map((compte) => compte.avatarMediaId)
    .filter((identifiant): identifiant is string => identifiant !== null);

  const medias = await getMediaByIds(await mediaReadPort(), identifiants);

  const avatars: Record<string, MediaAsset> = {};
  if (medias.ok) {
    for (const media of medias.value) avatars[media.id] = media;
  }

  return (
    <UsersClient
      comptes={comptes.value}
      avatars={avatars}
      moiId={actor.id}
      peutInviter={can(actor, "user:create")}
      peutGererComptes={can(actor, "user:update")}
      peutSupprimer={can(actor, "user:delete")}
    />
  );
}
