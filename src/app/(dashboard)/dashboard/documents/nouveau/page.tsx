import type { Metadata } from "next";

import { AnnualReportForm } from "@/components/dashboard/documents/annual-report-form";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { requirePermission } from "@/server/dal/session";

/**
 * /dashboard/documents/nouveau — §8I.
 *
 * `document:create`, et non `document:update` : un éditeur crée et modifie,
 * mais la permission exigée doit être celle de l'action réelle. La Server
 * Action revérifie la même — c'est la deuxième barrière du §9 — et la RLS la
 * troisième.
 *
 * ---------------------------------------------------------------------------
 * UN RAPPORT NAÎT TOUJOURS EN BROUILLON
 * ---------------------------------------------------------------------------
 * Comme aux Lots 8C, 8D, 8F et 8H : `createAnnualReportSchema` ne transporte
 * même pas `status`, et le cas d'usage écrit `'draft'` en dur — de sorte
 * qu'aucune requête, fût-elle celle d'un super administrateur, ne puisse mettre
 * un rapport en ligne sans passer par `setAnnualReportStatus`.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  AUCUNE LECTURE AVANT LE RENDU — contrairement aux Lots 8B et 8H
 * ---------------------------------------------------------------------------
 * Ces deux-là devaient charger leurs catégories pour alimenter un `select` dont
 * les options sont dynamiques (écart nº 40 : les options d'un champ de
 * référence sont FOURNIES par l'écran). Les trois champs d'un rapport — année,
 * titre, PDF — ne dépendent d'aucune autre collection : le `<MediaPicker>`
 * charge lui-même la médiathèque, à l'ouverture de sa modale et seulement
 * alors.
 *
 * C'est le seul écran de création du Lot 8 sans requête préalable, et il n'y a
 * donc rien à rendre tolérant à l'échec.
 */
export const metadata: Metadata = {
  title: "Ajouter un rapport",
};

export default async function NouveauRapportAnnuelPage() {
  await requirePermission("document:create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Ajouter un rapport d'activité"
        description="Indiquez l'année et le titre. Le PDF est facultatif : il peut être rattaché plus tard, depuis cette même fiche. Le rapport est enregistré en brouillon — il n'apparaîtra sur la page Impact qu'une fois publié."
      />

      <AnnualReportForm />
    </div>
  );
}
