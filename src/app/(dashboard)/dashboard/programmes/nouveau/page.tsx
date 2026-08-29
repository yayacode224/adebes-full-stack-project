import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/layout/page-header";
import { ProgrammeForm } from "@/components/dashboard/programmes/programme-form";
import { requirePermission } from "@/server/dal/session";

/**
 * /dashboard/programmes/nouveau — §8A.
 *
 * `programme:create`, et non `programme:update` : un éditeur crée et modifie,
 * mais la permission exigée doit être celle de l'action réelle. La Server
 * Action revérifie la même — c'est la deuxième barrière du §9 — et la RLS la
 * troisième.
 *
 * ---------------------------------------------------------------------------
 * UN PROGRAMME NAÎT TOUJOURS EN BROUILLON
 * ---------------------------------------------------------------------------
 * Le cas d'usage l'impose (`status: input.status ?? 'draft'`) et l'écran le
 * DIT, plutôt que de laisser croire à une mise en ligne immédiate. Publier est
 * une décision distincte, prise depuis la fiche, avec une autre permission.
 */
export const metadata: Metadata = {
  title: "Nouveau programme",
};

export default async function NouveauProgrammePage() {
  await requirePermission("programme:create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nouveau programme"
        description="Le programme est enregistré en brouillon : il ne sera visible sur le site qu'une fois publié."
      />

      <ProgrammeForm />
    </div>
  );
}
