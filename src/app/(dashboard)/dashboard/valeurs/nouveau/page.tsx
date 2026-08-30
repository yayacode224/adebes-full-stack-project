import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/layout/page-header";
import { ValueForm } from "@/components/dashboard/values/value-form";
import { requirePermission } from "@/server/dal/session";

/**
 * /dashboard/valeurs/nouveau — §8E.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `value:create` EST RÉSERVÉE AUX ADMINISTRATEURS
 * ---------------------------------------------------------------------------
 * C'est le premier écran « nouveau » du Lot 8 qu'un éditeur ne peut pas
 * atteindre : `value:create` est absent de sa liste (§9 du Rapport 1). La
 * Server Action revérifie la même permission — c'est la deuxième barrière — et
 * la RLS la troisième (`core_values_admin_insert` exige `app_can_publish()`).
 *
 * Les trois disent la même chose de trois manières indépendantes, ce qui est
 * précisément l'intérêt : `requirePermission` protège l'ÉCRAN, `createAction`
 * protège l'ACTION — joignable par un POST direct sans passer par cette page —
 * et la RLS protège la DONNÉE, y compris contre une faute de programmation dans
 * les deux premières.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE VALEUR NAÎT VISIBLE — L'INVERSE DES QUATRE LOTS PRÉCÉDENTS
 * ---------------------------------------------------------------------------
 * Il n'y a pas de brouillon d'un principe. Aucune permission `value:publish`
 * n'existe, aucune garde n'est à forcer, et la base écrit `is_visible = true`
 * par défaut. Naître masquée n'aurait donc rien protégé : cela aurait imposé un
 * second geste pour arriver à l'état que tout le monde voulait.
 *
 * La conséquence est dite à l'écran plutôt que découverte : la valeur créée
 * apparaît immédiatement sur DEUX pages publiques.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE LECTURE AVANT LE RENDU
 * ---------------------------------------------------------------------------
 * Comme au Lot 8D : le formulaire n'a pas de champ `reference`, donc aucune
 * liste d'options à fournir (écart nº 40). La page se réduit à sa garde d'accès
 * et à son titre.
 */
export const metadata: Metadata = {
  title: "Nouvelle valeur",
};

export default async function NouvelleValeurPage() {
  await requirePermission("value:create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nouvelle valeur"
        description="Une valeur créée est immédiatement affichée sur la page d'accueil et sur « Qui sommes-nous ». Vous pourrez la masquer à tout moment sans perdre son texte."
      />

      <ValueForm />
    </div>
  );
}
