import { Construction } from "lucide-react";
import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { PageHeader } from "@/components/dashboard/layout/page-header";
import { DASHBOARD_NAVIGATION } from "@/lib/dashboard-navigation";
import { requireActor, requirePermission } from "@/server/dal/session";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  FOURRE-TOUT DES ÉCRANS DE GESTION PAS ENCORE LIVRÉS
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * AJOUT AU PÉRIMÈTRE DU LOT 5, ASSUMÉ
 * ---------------------------------------------------------------------------
 * Le §5 du Rapport 2 demande une navigation « vide mais complète ». Complète,
 * elle pointe vers dix-sept écrans dont un seul existe : les seize autres
 * renverraient aujourd'hui la 404 DU SITE PUBLIC, avec ses boutons « Faire un
 * don » et « Devenir bénévole » — le défaut relevé en découverte de terrain
 * nº 4 du fichier de reprise. Une barre latérale complète dont tous les liens
 * éjectent l'utilisateur hors du dashboard n'est pas une coquille livrée.
 *
 * Ce fichier unique remplace seize pages d'attente. Il disparaîtra de
 * lui-même : une route statique l'emporte toujours sur un fourre-tout, donc
 * chaque écran livré aux Lots 7 à 13 le court-circuite sans qu'on ait à y
 * revenir. Le jour où les dix-sept existent, ce fichier ne sert plus qu'à
 * transformer une URL de gestion inconnue en 404 du dashboard — ce qui reste
 * utile, et justifie de le garder.
 *
 * ---------------------------------------------------------------------------
 * IL NE CONTOURNE AUCUNE GARDE
 * ---------------------------------------------------------------------------
 * L'écran d'attente n'est rendu que si le chemin correspond EXACTEMENT à une
 * entrée de navigation déclarée, et seulement après `requirePermission()`.
 * Un éditeur qui tape `/dashboard/utilisateurs` à la main est renvoyé au
 * tableau de bord avec le message de droits insuffisants, exactement comme il
 * le sera une fois l'écran réel livré au Lot 13.
 *
 * Correspondance EXACTE, et non par préfixe : `/dashboard/programmes/inconnu`
 * n'est pas un écran d'attente légitime, c'est une adresse fausse. Elle doit
 * donner une 404, pas un message rassurant.
 *
 * `notFound()` renvoie bien un statut HTTP 404 et sélectionne
 * `dashboard/not-found.tsx` — mesuré en recette. Cette page-là se met en page
 * seule : Next.js ne rejoue pas les layouts au-dessus d'un `notFound()` levé
 * dans une route dynamique. Voir son en-tête.
 */
export const metadata: Metadata = {
  title: "Écran à venir",
};

export default async function EcranAVenir({
  params,
}: PageProps<"/dashboard/[...segments]">) {
  // `await params` — obligatoire en Next.js 16.
  const { segments } = await params;
  const chemin = `/dashboard/${segments.join("/")}`;

  const entree = DASHBOARD_NAVIGATION.find((item) => item.href === chemin);

  // Adresse inconnue : la 404 du dashboard, pas celle du site public.
  if (!entree) notFound();

  if (entree.permission) {
    await requirePermission(entree.permission);
  } else {
    await requireActor(chemin);
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader title={entree.label} />

      <div className="flex flex-col items-start gap-3 rounded-xl border border-dashed border-border bg-card px-4 py-8 text-center sm:items-center sm:px-6">
        <Construction
          className="size-8 text-muted-foreground sm:mx-auto"
          aria-hidden="true"
        />
        <div className="text-left sm:text-center">
          <p className="font-heading text-base font-semibold text-foreground">
            Cet écran n&apos;est pas encore disponible.
          </p>
          <p className="mt-1 max-w-md text-sm text-muted-foreground">
            La navigation est en place ; la gestion de «&nbsp;{entree.label}
            &nbsp;» sera activée lors d&apos;une prochaine mise à jour.
          </p>
        </div>
      </div>
    </div>
  );
}
