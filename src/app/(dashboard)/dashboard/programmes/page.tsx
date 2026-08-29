import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { ProgrammesClient } from "@/components/dashboard/programmes/programmes-client";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { can } from "@/core/rbac/policy";
import { getMediaByIds } from "@/core/use-cases/media/get-media";
import { listProgrammes } from "@/core/use-cases/programmes/list-programmes";
import { requirePermission } from "@/server/dal/session";
import { mediaReadPort } from "@/server/deps/media.deps";
import { programmeReadPort } from "@/server/deps/programme.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/programmes
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8A.3 du Rapport 2.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc un
 * `ProgrammeReadPort` à `server/deps/`, et le passe à `listProgrammes`. Le nom
 * `SupabaseProgrammeRepository` n'apparaît nulle part ici.
 *
 * Le port est celui de LECTURE seule : cette page ne doit pas pouvoir écrire,
 * et ce n'est pas une question de discipline mais de type.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire (§15, règle 10 du Rapport 1). Et elle ne doit
 * surtout pas être mise en cache — un programme publié il y a dix secondes
 * doit apparaître avec son nouvel état.
 */
export const metadata: Metadata = {
  title: "Programmes",
};

/**
 * Tous les programmes, brouillons compris.
 *
 * La collection en compte huit et n'a pas vocation à en compter deux cents :
 * `<DataTable>` filtre, trie et pagine en mémoire (§6.1). La borne existe
 * malgré tout — `MAX_PAGE_SIZE` vaut 100 — et c'est elle qui rendrait le
 * problème visible si la collection dérivait un jour.
 */
const TAILLE_PAGE = 100;

export default async function ProgrammesPage() {
  const actor = await requirePermission("programme:read");

  const read = await programmeReadPort();
  const programmes = await listProgrammes(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "position",
    sortDirection: "asc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a
    aucun programme » et « on n'a pas pu les lire » ne sont pas la même
    information, et les confondre est exactement ce que l'invariant nº 1
    interdit. Le second appelle « Réessayer », le premier « Créer ».
  */
  if (!programmes.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Programmes"
          description="Les domaines d'intervention de l'association."
        />
        <ErrorState
          title="La liste des programmes n'a pas pu être chargée"
          message={programmes.error.message}
        />
      </div>
    );
  }

  /*
    Les couvertures sont résolues ICI, en une requête, et non par la colonne
    du tableau : huit vignettes chargées une par une depuis le navigateur,
    ce serait huit allers-retours après le rendu, et huit cases vides en
    attendant.

    Un échec ne justifie pas d'écran d'erreur — la liste reste lisible sans
    ses vignettes, et la colonne dit alors « aucune image ».
  */
  const identifiants = programmes.value.items
    .map((programme) => programme.coverMediaId)
    .filter((identifiant): identifiant is string => identifiant !== null);

  const medias = await getMediaByIds(await mediaReadPort(), identifiants);

  const couvertures: Record<string, MediaAsset> = {};
  if (medias.ok) {
    for (const media of medias.value) couvertures[media.id] = media;
  }

  return (
    <ProgrammesClient
      programmes={programmes.value.items}
      couvertures={couvertures}
      peutCreer={can(actor, "programme:create")}
      peutModifier={can(actor, "programme:update")}
      peutPublier={can(actor, "programme:publish")}
      peutSupprimer={can(actor, "programme:delete")}
      peutReordonner={can(actor, "programme:reorder")}
    />
  );
}
