import type { Metadata } from "next";

import { MediathequeClient } from "@/components/dashboard/media/mediatheque-client";
import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { can } from "@/core/rbac/policy";
import { listMedia, listMediaFolders } from "@/core/use-cases/media/list-media";
import { mediaReadPort } from "@/server/deps/media.deps";
import { requirePermission } from "@/server/dal/session";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/mediatheque
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §7.1 du Rapport 2.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc un
 * `MediaReadPort` à `server/deps/`, et le passe à `listMedia`. Le dépôt
 * Supabase n'est nommé nulle part ici.
 *
 * Le port est celui de LECTURE seule : cette page ne doit pas pouvoir écrire,
 * et ce n'est pas une question de discipline mais de type.
 *
 * ---------------------------------------------------------------------------
 * TROIS BARRIÈRES, TOUJOURS
 * ---------------------------------------------------------------------------
 * `requirePermission('media:read')` est la deuxième (§9 du Rapport 1). La
 * troisième est la RLS, qui s'applique de toute façon puisque le dépôt reçoit
 * le client porteur de la session. Les permissions d'écriture sont calculées
 * ici et transmises à l'interface : un bouton « Supprimer » rendu puis refusé
 * au clic est une promesse non tenue, et les Server Actions les revérifient
 * quoi qu'il arrive.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire (§15, règle 10 du Rapport 1). Et elle ne doit
 * surtout pas être mise en cache — un fichier téléversé il y a dix secondes
 * doit apparaître.
 */
export const metadata: Metadata = {
  title: "Médiathèque",
};

/** Première page servie par le rendu serveur. Doit valoir celle du client. */
const TAILLE_PAGE = 48;

export default async function MediathequePage() {
  const actor = await requirePermission("media:read");

  const read = await mediaReadPort();

  // Les deux lectures sont indépendantes : les enchaîner ajouterait un
  // aller-retour à l'affichage initial de la grille.
  const [medias, dossiers] = await Promise.all([
    listMedia(read, { page: 1, pageSize: TAILLE_PAGE }),
    listMediaFolders(read),
  ]);

  /*
    Une lecture en échec ne doit pas produire une grille vide : « il n'y a
    rien » et « on n'a pas pu lire » ne sont pas la même information, et les
    confondre est exactement ce que l'invariant nº 1 interdit.
  */
  if (!medias.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Médiathèque"
          description="Les photos et les documents utilisables dans les pages, les programmes et les actualités."
        />
        <ErrorState
          title="La médiathèque n'a pas pu être chargée"
          message={medias.error.message}
        />
      </div>
    );
  }

  return (
    <MediathequeClient
      pageInitiale={medias.value}
      // Un échec du seul chargement des dossiers ne justifie pas d'écran
      // d'erreur : le filtre par dossier disparaît, la médiathèque reste
      // utilisable.
      dossiers={dossiers.ok ? dossiers.value : []}
      actorId={actor.id}
      peutTeleverser={can(actor, "media:create")}
      peutModifier={can(actor, "media:update")}
      peutSupprimer={can(actor, "media:delete")}
    />
  );
}
