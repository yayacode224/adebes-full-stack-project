import type { Metadata } from "next";

import { ErrorState } from "@/components/dashboard/feedback/error-state";
import { JournalClient } from "@/components/dashboard/journal/journal-client";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import type { AuditFilters } from "@/core/cms/entities/audit-entry";
import type { UserAccount } from "@/core/cms/entities/user-account";
import { auditFiltersSchema } from "@/core/cms/schemas/audit-log.schema";
import { listAuditEntries } from "@/core/use-cases/audit/list-audit-entries";
import { listUserAccounts } from "@/core/use-cases/users/list-user-accounts";
import { requirePermission } from "@/server/dal/session";
import { auditLogReadPort } from "@/server/deps/audit-log.deps";
import { userAccountReadPort } from "@/server/deps/user-account.deps";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  /dashboard/journal (§13.3 du Rapport 2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Lecture seule. La RLS `audit_logs_admin_read` réserve la table aux
 * administrateurs ; la page exige en plus `audit:read` — un éditeur est
 * renvoyé au tableau de bord avant même la requête (`requirePermission`).
 *
 * Le filtrage est fait EN BASE : les critères viennent de l'URL, sont
 * assainis par `auditFiltersSchema`, et passés au repository. La lecture est
 * bornée à `LIMITE` lignes ; l'écran le signale quand la fenêtre est pleine.
 */
export const metadata: Metadata = {
  title: "Journal d'activité",
};

/** Plafond de lecture. Au-delà, l'écran invite à resserrer les filtres. */
const LIMITE = 200;

function premier(valeur: string | string[] | undefined): string | undefined {
  return Array.isArray(valeur) ? valeur[0] : valeur;
}

export default async function JournalPage({
  searchParams,
}: PageProps<"/dashboard/journal">) {
  await requirePermission("audit:read");

  const params = await searchParams;
  const filtres: AuditFilters = auditFiltersSchema.parse({
    actorId: premier(params.auteur),
    entityType: premier(params.type),
    action: premier(params.action),
    from: premier(params.du),
    to: premier(params.au),
  });

  const [entrees, comptes] = await Promise.all([
    listAuditEntries(await auditLogReadPort(), filtres, LIMITE),
    listUserAccounts(await userAccountReadPort()),
  ]);

  if (!entrees.ok) {
    return (
      <div className="flex flex-col gap-6">
        <PageHeader
          title="Journal d'activité"
          description="Toutes les actions effectuées dans le dashboard."
        />
        <ErrorState
          title="Le journal n'a pas pu être chargé"
          message={entrees.error.message}
        />
      </div>
    );
  }

  const annuaire: Record<string, UserAccount> = {};
  if (comptes.ok) {
    for (const compte of comptes.value) annuaire[compte.id] = compte;
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Journal d'activité"
        description="Chaque connexion, chaque modification, avec son auteur, son horodatage et le détail des champs touchés. Conservation : 180 jours."
      />

      <JournalClient
        entries={entrees.value}
        comptes={annuaire}
        filtres={filtres}
        limite={LIMITE}
      />
    </div>
  );
}
