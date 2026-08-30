import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/layout/page-header";
import { StatForm } from "@/components/dashboard/stats/stat-form";
import { requirePermission } from "@/server/dal/session";

/**
 * /dashboard/chiffres/nouveau — §8G.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `stat:create` EST RÉSERVÉE AUX ADMINISTRATEURS
 * ---------------------------------------------------------------------------
 * Comme `value:create` au Lot 8E : la permission est absente de la liste
 * `editor` (§9 du Rapport 1). La Server Action revérifie la même permission —
 * c'est la deuxième barrière — et la RLS la troisième (`stats_admin_insert`
 * exige `app_can_publish()`).
 *
 * Les trois disent la même chose de trois manières indépendantes :
 * `requirePermission` protège l'ÉCRAN, `createAction` protège l'ACTION —
 * joignable par un POST direct sans passer par cette page — et la RLS protège
 * la DONNÉE, y compris contre une faute de programmation dans les deux
 * premières.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UN CHIFFRE NAÎT VISIBLE, ET SANS VALEUR
 * ---------------------------------------------------------------------------
 * Deux défauts délibérés, et le second est la raison d'être de ce lot :
 *
 *   * **visible** — aucune permission `stat:publish` n'existe, aucune garde
 *     n'est à forcer, et la base écrit `is_visible = true` par défaut ;
 *   * **sans valeur** — le formulaire s'ouvre avec la case « Ce chiffre n'est
 *     pas encore disponible » COCHÉE. Un champ numérique à `0` par défaut
 *     aurait suffi à publier un zéro que personne n'a voulu, en enregistrant
 *     sans y toucher.
 *
 * La conséquence est dite à l'écran plutôt que découverte : la carte créée
 * apparaît immédiatement sur DEUX pages publiques, avec « — » tant qu'aucun
 * chiffre n'est saisi.
 *
 * ---------------------------------------------------------------------------
 * AUCUNE LECTURE AVANT LE RENDU
 * ---------------------------------------------------------------------------
 * Comme aux Lots 8D et 8E : le formulaire n'a pas de champ `reference`, donc
 * aucune liste d'options à fournir (écart nº 40). La page se réduit à sa garde
 * d'accès et à son titre.
 */
export const metadata: Metadata = {
  title: "Nouveau chiffre",
};

export default async function NouveauChiffrePage() {
  await requirePermission("stat:create");

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        title="Nouveau chiffre"
        description="Une carte créée est immédiatement affichée sur la page d'accueil et sur « Impact & transparence ». Tant que le chiffre n'a pas été fourni, elle affiche « — » : c'est un état voulu, jamais un zéro."
      />

      <StatForm />
    </div>
  );
}
