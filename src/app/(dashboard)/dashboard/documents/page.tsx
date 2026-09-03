import type { Metadata } from "next";

import { AnnualReportsClient } from "@/components/dashboard/documents/annual-reports-client";
import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import type { MediaAsset } from "@/core/cms/entities/media-asset";
import { can } from "@/core/rbac/policy";
import { listAnnualReports } from "@/core/use-cases/annual-reports/list-annual-reports";
import { getMediaByIds } from "@/core/use-cases/media/get-media";
import { requirePermission } from "@/server/dal/session";
import { annualReportReadPort } from "@/server/deps/annual-report.deps";
import { mediaReadPort } from "@/server/deps/media.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/documents
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8I du Rapport 2, sur le gabarit du §8A.3. L'entrée de navigation existait
 * depuis le Lot 5 (`dashboard-navigation.ts`, permission `document:read`) et
 * menait jusqu'ici à une 404 : ce lot lui donne sa destination. C'est la
 * dernière des neuf entrées « Contenu » à être branchée.
 *
 * ---------------------------------------------------------------------------
 * LA PAGE N'APPELLE PAS DE DÉPÔT
 * ---------------------------------------------------------------------------
 * §4 du Rapport 1 : « Une page du dashboard n'appelle JAMAIS un repository :
 * elle appelle un cas d'usage via le contrôleur. » Elle demande donc des ports
 * de LECTURE à `server/deps/`. Le nom `SupabaseAnnualReportRepository`
 * n'apparaît nulle part ici.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX LECTURES, ET LA SECONDE PEUT LÉGITIMEMENT NE RIEN RENDRE
 * ---------------------------------------------------------------------------
 *   1. **les rapports** — la collection elle-même. Sans eux, il n'y a pas
 *      d'écran : un échec rend `<ErrorState>`.
 *   2. **les documents** — pour afficher le nom et le poids du PDF plutôt qu'un
 *      UUID. Un échec rend une liste vide, et l'écran DIT « Fichier
 *      introuvable » sur les lignes concernées.
 *
 * ⚠️  Différence avec le Lot 8H : là-bas, `media_id` était `not null` et la
 * liste d'identifiants ne pouvait pas être vide. Ici elle l'est presque
 * toujours — les deux rapports existants n'ont aucun PDF — et il faut donc
 * FILTRER les `null` avant d'appeler `getMediaByIds`. Sans ce filtre, on
 * enverrait un tableau contenant `null` à une lecture qui attend des UUID.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `'use cache'`
 * ---------------------------------------------------------------------------
 * C'est une lecture AUTHENTIFIÉE : elle dépend des cookies, qu'un scope
 * `'use cache'` ne peut pas lire (§15, règle 10 du Rapport 1). Et elle ne doit
 * surtout pas être mise en cache — un rapport publié il y a dix secondes doit
 * apparaître avec son nouvel état.
 */
export const metadata: Metadata = {
  title: "Documents",
};

/**
 * Tous les rapports, brouillons compris.
 *
 * `<DataTable>` filtre, trie et pagine en mémoire (§6.1), ce qui suppose que la
 * collection tienne dans une page. L'hypothèse est plus solide ici que partout
 * ailleurs : une association publie un rapport par an, et il en faudrait cent
 * pour atteindre la borne. L'écran DIT quand même le total dès qu'il dépasse ce
 * qui est chargé — même règle qu'aux Lots 8B et 8H (écart nº 79).
 */
const TAILLE_PAGE = 100;

export default async function DocumentsPage() {
  const actor = await requirePermission("document:read");

  const read = await annualReportReadPort();
  const rapports = await listAnnualReports(read, {
    page: 1,
    pageSize: TAILLE_PAGE,
    sortBy: "position",
    sortDirection: "asc",
  });

  /*
    Une lecture en échec ne doit pas produire une liste vide : « il n'y a aucun
    rapport » et « on n'a pas pu les lire » ne sont pas la même information, et
    les confondre est exactement ce que l'invariant nº 1 interdit. Le second
    appelle « Réessayer », le premier « Ajouter ».
  */
  if (!rapports.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Documents"
          description="Les rapports d'activité de la page Impact & transparence."
        />
        <ErrorState
          title="La liste des rapports n'a pas pu être chargée"
          message={rapports.error.message}
        />
      </div>
    );
  }

  /*
    Les PDF. `document_media_id` est NULLABLE — contrairement au Lot 8H, il y a
    donc des identifiants à filtrer, et c'est même le cas courant.

    Le `Set` reste utile : deux rapports peuvent pointer sur le même fichier.
    C'est presque sûrement une erreur de saisie, et c'est l'écran qui le
    signale — pas cette lecture, qui n'aurait aucune raison de la charger deux
    fois pour autant.
  */
  const identifiants = [
    ...new Set(
      rapports.value.items
        .map((rapport) => rapport.documentMediaId)
        .filter((id): id is string => id !== null),
    ),
  ];

  const medias: Record<string, MediaAsset> = {};

  // ⚠️  `getMediaByIds([])` serait une requête inutile — et, selon le dépôt, une
  // requête `in.()` mal formée. On ne l'appelle donc que s'il y a quelque chose
  // à résoudre, ce qui est l'état de départ de cette collection.
  if (identifiants.length > 0) {
    const resolus = await getMediaByIds(await mediaReadPort(), identifiants);
    if (resolus.ok) {
      for (const media of resolus.value) medias[media.id] = media;
    }
  }

  return (
    <AnnualReportsClient
      rapports={rapports.value.items}
      medias={medias}
      total={rapports.value.total}
      peutCreer={can(actor, "document:create")}
      peutModifier={can(actor, "document:update")}
      peutPublier={can(actor, "document:publish")}
      peutSupprimer={can(actor, "document:delete")}
      peutReordonner={can(actor, "document:reorder")}
    />
  );
}
