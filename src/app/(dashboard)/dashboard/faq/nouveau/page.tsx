import type { Metadata } from "next";

import { FaqItemForm } from "@/components/dashboard/faq/faq-item-form";
import { PageHeader } from "@/components/dashboard/layout/page-header";
import { requirePermission } from "@/server/dal/session";

/**
 * /dashboard/faq/nouveau — §8F.
 *
 * `faq:create`, et non `faq:update` : un éditeur crée et modifie, mais la
 * permission exigée doit être celle de l'action réelle. La Server Action
 * revérifie la même — c'est la deuxième barrière du §9 — et la RLS la
 * troisième.
 *
 * ---------------------------------------------------------------------------
 * UNE QUESTION NAÎT TOUJOURS EN BROUILLON
 * ---------------------------------------------------------------------------
 * Comme aux Lots 8C et 8D : `createFaqItemSchema` ne transporte même pas
 * `status`, et le cas d'usage écrit `'draft'` en dur — de sorte qu'aucune
 * requête, fût-elle celle d'un super administrateur, ne puisse créer une
 * question déjà en ligne, donc déjà déclarée aux moteurs de recherche, sans
 * passer par `setFaqItemStatus`.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE LECTURE AVANT LE RENDU
 * ---------------------------------------------------------------------------
 * Le formulaire n'a pas de champ `reference` ni `media` : ses trois options de
 * sujet sont figées par une contrainte SQL et déclarées dans le domaine. La
 * page se réduit à sa garde d'accès et à son titre.
 */
export const metadata: Metadata = {
  title: "Nouvelle question",
};

export default async function NouvelleQuestionPage() {
  await requirePermission("faq:create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nouvelle question"
        description="La question est enregistrée en brouillon. Elle ne sera visible sur le site — ni dans les résultats de recherche — qu'une fois publiée."
      />

      <FaqItemForm />
    </div>
  );
}
