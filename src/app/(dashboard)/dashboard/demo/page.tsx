import type { Metadata } from "next";

import { PageHeader } from "@/components/dashboard/layout/page-header";
import { requireActor } from "@/server/dal/session";

import { DemoClient } from "./demo-client";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  BANC D'ESSAI DU DESIGN SYSTEM
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * `demo` ET NON `_demo` — ÉCART Nº 3, DÉJÀ CONSIGNÉ
 * ---------------------------------------------------------------------------
 * Le §6.5 du Rapport 2 écrit `/dashboard/_demo`. Next.js exclut du routage
 * tout dossier préfixé par `_` : la page ne serait jamais servie, et le lot
 * serait déclaré terminé sur une page inatteignable.
 *
 * ---------------------------------------------------------------------------
 * ELLE N'EST PAS DANS LA NAVIGATION, ET C'EST VOULU
 * ---------------------------------------------------------------------------
 * `DASHBOARD_NAVIGATION` ne la référence pas : c'est un outil de
 * développement, pas un écran de gestion. Une route statique l'emporte sur le
 * fourre-tout `[...segments]`, elle reste donc atteignable par son adresse.
 *
 * ---------------------------------------------------------------------------
 * ELLE EST MALGRÉ TOUT GARDÉE
 * ---------------------------------------------------------------------------
 * `requireActor()` : le banc ne montre aucune donnée réelle, mais une page du
 * dashboard ouverte à l'anonyme resterait une porte ouverte, et le §13 ne fait
 * pas d'exception pour les pages « sans importance ».
 *
 * Aucune permission particulière n'est exigée : il n'y a rien à protéger de
 * plus fin qu'une session valide, et inventer une permission pour un outil
 * temporaire polluerait la matrice du §9.
 *
 * **Supprimée au Lot 16**, avec `demo-client.tsx` et `demo-data.ts`.
 */
export const metadata: Metadata = {
  title: "Banc d'essai",
};

export default async function DemoPage() {
  await requireActor("/dashboard/demo");

  return (
    <div className="flex flex-col gap-8">
      <PageHeader
        title="Banc d'essai du design system"
        description="Les six composants du Lot 6 dans tous leurs états. Page de développement, retirée avant la mise en ligne."
      />

      <DemoClient />
    </div>
  );
}
