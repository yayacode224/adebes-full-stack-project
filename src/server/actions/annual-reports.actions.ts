"use server";

import type { AnnualReport } from "@/core/cms/entities/annual-report";
import {
  annualReportIdSchema,
  createAnnualReportSchema,
  reorderAnnualReportsSchema,
  setAnnualReportStatusSchema,
  updateAnnualReportSchema,
} from "@/core/cms/schemas/annual-report.schema";
import { createAnnualReport } from "@/core/use-cases/annual-reports/create-annual-report";
import { deleteAnnualReport } from "@/core/use-cases/annual-reports/delete-annual-report";
import { reorderAnnualReports } from "@/core/use-cases/annual-reports/reorder-annual-reports";
import { setAnnualReportStatus } from "@/core/use-cases/annual-reports/set-annual-report-status";
import { updateAnnualReport } from "@/core/use-cases/annual-reports/update-annual-report";

import { createAction } from "../action-kit/create-action";
import { annualReportDeps } from "../deps/annual-report.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  SERVER ACTIONS DES RAPPORTS ANNUELS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8I du Rapport 2. Les cinq passent par `createAction` — aucune exception
 * (décision D3). Une Server Action est une frontière publique : sans le
 * décorateur, `supprimerRapportAnnuelAction` serait une API de suppression
 * ouverte, joignable par un POST direct sans jamais passer par le dashboard.
 *
 * ---------------------------------------------------------------------------
 * DEUX ÉTIQUETTES DE CACHE, DONT UNE DÉJÀ POSÉE PAR UN AUTRE LOT
 * ---------------------------------------------------------------------------
 * `cms:documents` est nouvelle. `cms:page:impact` ne l'est PAS : elle a été
 * créée au Lot 8G pour les chiffres clés, et `stats.actions.ts` l'invalide
 * déjà. C'est la première fois de la série que deux collections partagent une
 * étiquette de page — et c'est exact, puisque `/impact` lit désormais les deux.
 *
 * ⚠️  Il n'y en a pas de troisième, et c'est vérifié plutôt que supposé :
 * **aucune autre page publique n'affiche les rapports annuels**. Le seul import
 * de `rapports` dans tout `src/app/(site)/` était celui de `/impact`, et il
 * disparaît avec ce lot.
 *
 * `cms:media` n'est PAS invalidée : ces actions ne touchent jamais
 * `media_assets`. Un rapport RÉFÉRENCE un PDF, il ne le modifie pas — c'est la
 * médiathèque (Lot 7) qui en a la charge, et ses propres actions invalident
 * déjà cette étiquette-là.
 *
 * ---------------------------------------------------------------------------
 * LA RESSOURCE S'APPELLE `document`, PAS `annual_report`
 * ---------------------------------------------------------------------------
 * C'est le nom de la matrice du §9, et il est plus large que la table : le
 * §5.2 nomme l'écran « Documents ». Rien d'autre que les rapports annuels n'y
 * vit aujourd'hui, mais la permission n'a pas à être renommée le jour où un
 * autre type de document arrive. Les six actions sont déjà déclarées
 * (`document:read`, `:create`, `:update`, `:delete`, `:publish`, `:reorder`) —
 * contrairement à la ressource `value` du Lot 8E, qui manquait (écart nº 5).
 *
 * ---------------------------------------------------------------------------
 * AUCUNE ACTION DE LECTURE ICI
 * ---------------------------------------------------------------------------
 * Comme aux huit lots précédents : l'écran reçoit ses lignes du rendu serveur
 * et les filtre en mémoire (`<DataTable>`, §6.1).
 */

const ETIQUETTES = ["cms:documents", "cms:page:impact"];

/* ═══════════════════════════════════════════════════════════════════════════
 * Création
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Déclarer un rapport annuel.
 *
 * Le rapport naît en brouillon, sans exception : `createAnnualReportSchema` ne
 * transporte pas `status`, et le cas d'usage écrit `'draft'` en dur. C'est ce
 * qui garantit que toute mise en ligne passe par
 * `changerStatutRapportAnnuelAction`.
 *
 * ⚠️  Cette action ne téléverse RIEN. Le PDF rejoint la médiathèque par
 * `media.actions.ts` (Lot 7) ; ici on ne fait que désigner un document déjà
 * catalogué — ou aucun, ce qui est l'usage courant. La séparation est celle du
 * §7.3 : « renvoie un `mediaId`, jamais une URL ».
 */
export const creerRapportAnnuelAction = createAction<
  typeof createAnnualReportSchema,
  AnnualReport
>({
  permission: "document:create",
  input: createAnnualReportSchema,
  audit: {
    action: "annual_report.create",
    entityType: "annual_report",
    entityId: (rapport) => rapport.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    createAnnualReport(await annualReportDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Modification
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Modifier un rapport — son année, son titre, son PDF.
 *
 * `id` est retiré de la charge utile avant d'atteindre le cas d'usage
 * (écart nº 20) : il désigne la cible, il n'en fait pas partie.
 *
 * Le statut n'est pas modifiable ici — le cas d'usage le neutralise.
 */
export const mettreAJourRapportAnnuelAction = createAction<
  typeof updateAnnualReportSchema,
  AnnualReport
>({
  permission: "document:update",
  input: updateAnnualReportSchema,
  audit: {
    action: "annual_report.update",
    entityType: "annual_report",
    entityId: (rapport) => rapport.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const { id, ...champs } = input;
    return updateAnnualReport(await annualReportDeps(), id, champs);
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Publication
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Changer l'état éditorial.
 *
 * `document:publish` — absent de la liste `editor` (§9 du Rapport 1). La base
 * dit la même chose avec le trigger `annual_reports_guard_publish` (ADB01,
 * migration 0010) : un éditeur qui appellerait cette action par un POST direct
 * serait refusé deux fois.
 *
 * ⚠️  Publier un rapport SANS PDF est autorisé, et ce n'est pas un oubli de
 * garde — c'est la décision du lot, écrite au long dans
 * `set-annual-report-status.ts`. La page affiche alors « En cours de
 * préparation », comme elle le fait aujourd'hui.
 */
export const changerStatutRapportAnnuelAction = createAction<
  typeof setAnnualReportStatusSchema,
  AnnualReport
>({
  permission: "document:publish",
  input: setAnnualReportStatusSchema,
  audit: {
    action: "annual_report.publish",
    entityType: "annual_report",
    entityId: (rapport) => rapport.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) =>
    setAnnualReportStatus(await annualReportDeps(), input),
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Réordonnancement
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Réordonner la liste.
 *
 * `document:reorder` — ouvert à l'éditeur : réordonner n'est pas publier. La
 * base dit la même chose (`reorder_rows` exige `app_is_staff()`).
 *
 * ⚠️  Comme au Lot 8H et contrairement au Lot 8F (écart nº 120), l'ordre ne
 * décide de rien : `/impact` affiche TOUS les rapports publiés, sans coupe. Un
 * éditeur ne peut donc pas, en réordonnant, faire disparaître un document de
 * transparence du site.
 */
export const reordonnerRapportsAnnuelsAction = createAction<
  typeof reorderAnnualReportsSchema,
  { count: number }
>({
  permission: "document:reorder",
  input: reorderAnnualReportsSchema,
  audit: { action: "annual_report.reorder", entityType: "annual_report" },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const resultat = await reorderAnnualReports(
      await annualReportDeps(),
      input.orderedIds,
    );
    return resultat.ok
      ? { ok: true as const, value: { count: input.orderedIds.length } }
      : resultat;
  },
});

/* ═══════════════════════════════════════════════════════════════════════════
 * Suppression
 * ═══════════════════════════════════════════════════════════════════════════ */

/**
 * Supprimer un rapport annuel.
 *
 * `document:delete` — administrateurs seulement, doublé par la RLS
 * (`annual_reports_admin_delete`).
 *
 * ⚠️  Le PDF n'est pas supprimé : il reste dans la médiathèque. La confirmation
 * de l'écran l'écrit, et le cas d'usage l'explique.
 *
 * `documentMediaId` est lu AVANT la suppression : après, la ligne n'existe
 * plus, et l'appelant ne pourrait plus savoir quel fichier vient d'être libéré.
 */
export const supprimerRapportAnnuelAction = createAction<
  typeof annualReportIdSchema,
  { id: string; documentMediaId: string | null }
>({
  permission: "document:delete",
  input: annualReportIdSchema,
  audit: {
    action: "annual_report.delete",
    entityType: "annual_report",
    entityId: (resultat) => resultat.id,
  },
  invalidates: () => ETIQUETTES,
  handler: async ({ input }) => {
    const deps = await annualReportDeps();

    const existant = await deps.read.findById(input.id);
    const documentMediaId = existant?.documentMediaId ?? null;

    const resultat = await deleteAnnualReport(deps, input.id);
    return resultat.ok
      ? { ok: true as const, value: { id: input.id, documentMediaId } }
      : resultat;
  },
});
