"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

import { cn } from "@/lib/utils";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES ONGLETS DES ÉCRANS DE RÉGLAGES
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §10.1 du Rapport 2 et §10.2 de sa recette : « la navigation entre groupes
 * passe en onglets défilants horizontalement DANS LEUR PROPRE CONTENEUR,
 * jamais en faisant déborder la page ».
 *
 * « Thème » (Lot 11) est le septième onglet : la page vit sous
 * `/dashboard/reglages/theme`, elle hérite donc de ce bandeau — l'y omettre
 * afficherait des onglets qui ne mènent jamais à l'écran affiché.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DES LIENS, PAS LE `<Tabs>` DE RADIX (`components/ui/tabs.tsx`)
 * ---------------------------------------------------------------------------
 * Chaque groupe est une VRAIE route (`/dashboard/reglages/contact`, …) : le
 * §10.1 les liste comme six écrans, chacun avec sa propre adresse,
 * atteignable directement et par un rechargement. Le composant `<Tabs>` du
 * design system suppose l'inverse — un contenu qui change sans navigation,
 * comme les trois onglets de l'éditeur de pages (Lot 9), où « Sections »,
 * « Contenu » et « Réglages » ne sont pas trois URL. Lui emprunter son
 * apparence sans son mécanisme aurait forcé soit une fausse route (un état
 * client qui prétend être une page), soit un détournement des rôles ARIA
 * `tab`/`tabpanel` sur des liens qui, sémantiquement, sont un menu.
 *
 * ---------------------------------------------------------------------------
 * LE DÉBORDEMENT EST CONTENU, PAS SUPPRIMÉ
 * ---------------------------------------------------------------------------
 * `overflow-x-auto` porte sur CE conteneur, pas sur la page : six libellés,
 * dont « Réseaux sociaux » et « Mentions légales », ne tiennent pas sur
 * 390 px sans défiler. Les marges négatives (`-mx-4`) laissent le défilement
 * atteindre les bords de l'écran comme le reste du dashboard sous `md:`,
 * plutôt que de s'arrêter avec une marge visuellement fausse.
 */

const ONGLETS = [
  { href: "/dashboard/reglages", label: "Identité" },
  { href: "/dashboard/reglages/contact", label: "Contact" },
  { href: "/dashboard/reglages/legal", label: "Mentions légales" },
  { href: "/dashboard/reglages/reseaux", label: "Réseaux sociaux" },
  { href: "/dashboard/reglages/seo", label: "Référencement" },
  { href: "/dashboard/reglages/navigation", label: "Navigation" },
  { href: "/dashboard/reglages/theme", label: "Thème" },
] as const;

/** `/dashboard/reglages` est traité en correspondance EXACTE — sinon il est
 * préfixe de toutes les autres routes et reste éternellement actif, comme
 * `couvre()` le fait pour `/dashboard` (`dashboard-navigation.ts`). */
function estActif(pathname: string, href: string): boolean {
  if (href === "/dashboard/reglages") return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function SettingsTabs() {
  const pathname = usePathname();

  return (
    <nav aria-label="Groupes de réglages" className="-mx-4 overflow-x-auto sm:mx-0">
      <ul className="flex w-max min-w-full gap-1 border-b border-border px-4 sm:px-0">
        {ONGLETS.map((onglet) => {
          const actif = estActif(pathname, onglet.href);
          return (
            <li key={onglet.href} className="shrink-0">
              <Link
                href={onglet.href}
                aria-current={actif ? "page" : undefined}
                className={cn(
                  "flex h-11 items-center whitespace-nowrap border-b-2 px-3 text-sm font-medium transition-colors",
                  actif
                    ? "border-primary text-foreground"
                    : "border-transparent text-muted-foreground hover:text-foreground",
                )}
              >
                {onglet.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
