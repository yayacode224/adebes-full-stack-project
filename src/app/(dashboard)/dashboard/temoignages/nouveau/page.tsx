import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/layout/page-header";
import { TestimonialForm } from "@/components/dashboard/testimonials/testimonial-form";
import { lireOptionsProgrammes } from "@/server/dal/programme-options";
import { requirePermission } from "@/server/dal/session";

/**
 * /dashboard/temoignages/nouveau — §8C.
 *
 * `testimonial:create`, et non `testimonial:update` : un éditeur crée et
 * modifie, mais la permission exigée doit être celle de l'action réelle. La
 * Server Action revérifie la même — c'est la deuxième barrière du §9 — et la
 * RLS la troisième.
 *
 * ---------------------------------------------------------------------------
 * UN TÉMOIGNAGE NAÎT TOUJOURS EN BROUILLON
 * ---------------------------------------------------------------------------
 * Ici, ce n'est pas seulement une prudence éditoriale comme aux Lots 8A et
 * 8B : c'est ce qui rend la règle d'accord applicable. `createTestimonialSchema`
 * ne transporte même pas `status`, et le cas d'usage écrit `'draft'` en dur —
 * de sorte qu'aucune requête, fût-elle celle d'un super administrateur, ne
 * puisse créer un témoignage déjà en ligne sans passer par le contrôle
 * d'accord.
 *
 * L'écran le DIT, plutôt que de laisser croire à une mise en ligne immédiate.
 */
export const metadata: Metadata = {
  title: "Nouveau témoignage",
};

export default async function NouveauTemoignagePage() {
  await requirePermission("testimonial:create");

  const programmes = await lireOptionsProgrammes();

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nouveau témoignage"
        description="Le témoignage est enregistré en brouillon. Il ne sera visible sur le site qu'une fois l'accord de la personne enregistré et le témoignage publié."
      />

      <TestimonialForm programmes={programmes} />
    </div>
  );
}
