import type { Metadata } from "next";

import { NewPageForm } from "@/components/dashboard/pages/new-page-form";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { requirePermission } from "@/server/dal/session";

/**
 * /dashboard/pages/nouvelle — §9.2 du Rapport 2.
 *
 * `page:create`, et non `page:update` : la permission exigée doit être celle
 * de l'action réelle. La Server Action revérifie la même, et la RLS
 * (`pages_admin_insert`) la troisième.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'AVERTISSEMENT CI-DESSOUS N'EST PAS UNE FORMALITÉ
 * ---------------------------------------------------------------------------
 * `create-page.ts` le dit en toutes lettres : une page créée ici n'a, avant le
 * Lot 15, aucune route dynamique qui la sert. Elle existe en base, elle
 * s'édite, elle se publie — et son adresse répond 404 tant que
 * `src/app/(site)/[...segments]/page.tsx` n'est pas branché dessus.
 *
 * Le taire aurait laissé croire à une mise en ligne immédiate, exactement ce
 * que l'invariant nº 2 (aucun lien mort) interdit de faire croire.
 */
export const metadata: Metadata = {
  title: "Nouvelle page",
};

export default async function NouvellePagePage() {
  await requirePermission("page:create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nouvelle page"
        description="La page est enregistrée en brouillon, avec ses sections à composer ensuite."
      />

      <p className="rounded-lg border border-border bg-muted/30 px-4 py-3 text-sm text-muted-foreground">
        Cette page ne sera pas encore servie à son adresse dès sa création :
        le branchement des pages ajoutées depuis le dashboard sur une adresse
        réelle du site fait l&apos;objet d&apos;un lot ultérieur. Vous pouvez
        dès maintenant la composer et la publier ; son adresse deviendra
        active quand ce branchement sera livré.
      </p>

      <NewPageForm />
    </div>
  );
}
