import type { Metadata } from "next";
import { cookies } from "next/headers";

import { Logo } from "@/components/brand/logo";
import { DashboardShell } from "@/components/dashboard/layout/dashboard-shell";
import {
  COOKIE_BARRE_LATERALE,
  estRepliee,
} from "@/components/dashboard/layout/sidebar-state";
import { navigationPourActeur } from "@/lib/dashboard-navigation";
import { requireActor } from "@/server/dal/session";

export const metadata: Metadata = {
  title: { default: "Espace de gestion", template: "%s · Gestion ADEBES" },
  robots: { index: false, follow: false },
};

/** Le logo du dashboard reste discret : 32 px, comme les icônes de la barre. */
const LOGO_GESTION = "h-8";

/**
 * Layout du dashboard.
 *
 * ---------------------------------------------------------------------------
 * LA GARDE, AVANT TOUT LE RESTE
 * ---------------------------------------------------------------------------
 * `requireActor()` est la deuxième barrière du §9 du Rapport 1, et la seule
 * qui fasse autorité : elle relit le rôle et `is_active` EN BASE. `proxy.ts`
 * a peut-être déjà redirigé, mais il ne fait que lire un cookie — il ne sait
 * pas si le compte a été désactivé il y a trente secondes.
 *
 * Elle était déjà là au Lot 4 ; ce lot remplace le contenu, pas la garde.
 *
 * ---------------------------------------------------------------------------
 * LE FILTRAGE DE LA NAVIGATION A LIEU ICI, CÔTÉ SERVEUR
 * ---------------------------------------------------------------------------
 * `navigationPourActeur()` retire les entrées dont l'utilisateur n'a pas la
 * permission `read`. Seul le tableau filtré traverse la frontière vers la
 * coquille cliente : un éditeur ne reçoit même pas le libellé
 * « Utilisateurs » dans la charge utile RSC.
 *
 * Filtrer côté client aurait produit le même écran mais aurait laissé la
 * liste complète lisible dans l'onglet réseau — et la recette du lot exige
 * l'absence du DOM, pas l'absence à l'œil nu.
 *
 * ---------------------------------------------------------------------------
 * NI `SiteHeader`, NI `SiteFooter`, NI `pb-action-bar`
 * ---------------------------------------------------------------------------
 * Le chrome du site public est descendu dans `app/(site)/layout.tsx` au Lot 4,
 * `pb-action-bar` avec lui. Rien ne doit le rappeler ici.
 */
export default async function DashboardLayout({
  children,
}: LayoutProps<"/dashboard">) {
  const actor = await requireActor("/dashboard");

  // `await` obligatoire en Next.js 16.
  const cookieStore = await cookies();
  const replieInitial = estRepliee(
    cookieStore.get(COOKIE_BARRE_LATERALE)?.value,
  );

  return (
    <DashboardShell
      actor={actor}
      entrees={navigationPourActeur(actor)}
      replieInitial={replieInitial}
      /*
        `Logo` lit le système de fichiers (`resolveMedia`) : il ne peut être
        rendu que côté serveur. Les deux teintes sont fournies à la coquille
        cliente, qui laisse une classe CSS choisir — aucun état React, donc
        aucun clignotement au changement de thème.
      */
      logo={<Logo className={LOGO_GESTION} />}
      logoWhite={<Logo variant="white" className={LOGO_GESTION} />}
    >
      {children}
    </DashboardShell>
  );
}
