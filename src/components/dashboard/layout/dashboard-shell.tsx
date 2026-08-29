"use client";

import { usePathname } from "next/navigation";
import { useState, type ReactNode } from "react";

import type { Actor } from "@/core/rbac/roles";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  entreeActive,
  filAriane,
  type DashboardNavItem,
} from "@/lib/dashboard-navigation";
import { cn } from "@/lib/utils";

import { COOKIE_BARRE_LATERALE } from "./sidebar-state";
import { Sidebar } from "./sidebar";
import { Topbar } from "./topbar";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA COQUILLE DU DASHBOARD
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §5.3 du Rapport 2 : la responsivité du back-office est mise en place ICI,
 * une fois pour toutes. Les lots suivants s'y branchent — ils ne la refont
 * pas, et n'ont aucune raison de toucher à ce fichier pour ajouter un écran.
 *
 * ---------------------------------------------------------------------------
 * DEUX PRÉSENTATIONS, UNE SEULE SOURCE
 * ---------------------------------------------------------------------------
 *   ≥ 1024 px : `<aside>` fixe de 264 px, rétractable à 72 px.
 *   < 1024 px : la même navigation dans un `Sheet` gauche, fermé à la
 *               navigation par les `SheetClose` de chaque lien.
 *
 * La bascule est CSS (`hidden lg:flex`), pas JavaScript : `useIsDesktop()`
 * n'est pas appelé ici. Un rendu conditionnel piloté par la largeur
 * provoquerait un décalage d'hydratation et un clignotement au chargement,
 * que le §12 range explicitement dans les interdits.
 *
 * ---------------------------------------------------------------------------
 * `min-h-dvh`, JAMAIS `min-h-screen`
 * ---------------------------------------------------------------------------
 * `100vh` ignore la barre d'adresse mobile et coupe le bas de l'écran
 * (règle 5 du §12). La recette du lot le vérifie par un `grep`.
 *
 * ---------------------------------------------------------------------------
 * PAS DE `pb-action-bar`
 * ---------------------------------------------------------------------------
 * Cette classe réserve la hauteur de la `StickyMobileActionBar` du site
 * public, qui n'existe pas ici. Elle a été descendue dans
 * `app/(site)/layout.tsx` au Lot 4 ; la rappeler ici creuserait un espace mort
 * en bas de chaque écran de gestion.
 */

/**
 * Mémorisation de l'état rétracté.
 *
 * ---------------------------------------------------------------------------
 * ÉCART ASSUMÉ PAR RAPPORT AU §5.3 DU RAPPORT 2 : UN COOKIE, PAS `localStorage`
 * ---------------------------------------------------------------------------
 * Le rapport écrit « état mémorisé en `localStorage` ». C'est le réflexe
 * client, et il ne tient pas avec un rendu serveur : `localStorage` n'est
 * lisible qu'après l'hydratation. La barre serait donc rendue déployée par le
 * serveur, puis rétractée à l'exécution — un saut de 264 px à 72 px visible à
 * chaque chargement de page, et un `aria-expanded` faux le temps d'un rendu.
 *
 * Un cookie est lu PENDANT le rendu serveur (`app/(dashboard)/dashboard/
 * layout.tsx`) : le HTML part déjà dans le bon état. Ni saut, ni décalage
 * d'hydratation, ni annonce erronée. C'est le même arbitrage que fait
 * `next-themes`, déjà en place sur ce projet pour la même raison.
 *
 * La contrainte de recette — « l'état rétracté survit à un rechargement » —
 * est tenue à l'identique.
 *
 * Le nom du cookie vit dans `sidebar-state.ts`, module neutre : le layout
 * serveur ne peut pas importer une constante d'un module `"use client"`.
 */
const UN_AN_EN_SECONDES = 60 * 60 * 24 * 365;

/** Largeurs du §5.3 : 264 px déployée (`w-66`), 72 px rétractée (`w-18`). */
const LARGEUR_DEPLOYEE = "lg:w-66";
const LARGEUR_RETRACTEE = "lg:w-18";
const DECALAGE_DEPLOYE = "lg:pl-66";
const DECALAGE_RETRACTE = "lg:pl-18";

export function DashboardShell({
  actor,
  entrees,
  replieInitial,
  logo,
  logoWhite,
  children,
}: {
  actor: Actor;
  /** Déjà filtrée par permissions, côté serveur. */
  entrees: readonly DashboardNavItem[];
  replieInitial: boolean;
  /**
   * Le logo lit le système de fichiers (`resolveMedia`) : il ne peut être
   * rendu que côté serveur et arrive donc en prop, comme pour l'en-tête
   * public. Les deux teintes sont fournies, une classe CSS choisit.
   */
  logo: ReactNode;
  logoWhite: ReactNode;
  children: ReactNode;
}) {
  const pathname = usePathname();
  const [tiroirOuvert, setTiroirOuvert] = useState(false);
  const [replie, setReplie] = useState(replieInitial);

  const active = entreeActive(pathname, entrees);
  const etapes = filAriane(pathname, entrees);
  const titreCourt = active?.shortLabel ?? active?.label ?? "Espace de gestion";

  function basculerRetraction() {
    const suivant = !replie;
    setReplie(suivant);

    // Écrit hors de la fonction de mise à jour d'état : celle-ci est rejouée
    // en mode strict, et un effet de bord y serait exécuté deux fois.
    // `path=/dashboard` : ce réglage ne concerne aucune route publique.
    document.cookie = [
      `${COOKIE_BARRE_LATERALE}=${suivant ? "1" : "0"}`,
      "path=/dashboard",
      `max-age=${UN_AN_EN_SECONDES}`,
      "samesite=lax",
    ].join("; ");
  }

  return (
    /*
      La racine `Sheet` enveloppe TOUTE la coquille — elle ne rend aucun
      élément, seulement un contexte. C'est ce qui permet au bouton menu de la
      barre supérieure d'être un vrai `SheetTrigger` : Radix lui rend alors le
      focus à la fermeture du tiroir, exigence explicite du §5.3.
    */
    <Sheet open={tiroirOuvert} onOpenChange={setTiroirOuvert}>
      <div className="min-h-dvh bg-muted/30">
        {/* --- Colonne fixe, à partir de 1024 px ------------------------- */}
        <aside
          className={cn(
            "fixed inset-y-0 left-0 z-40 hidden border-r border-sidebar-border transition-[width] duration-200 lg:flex lg:flex-col",
            replie ? LARGEUR_RETRACTEE : LARGEUR_DEPLOYEE,
          )}
        >
          <Sidebar
            variante="fixe"
            entrees={entrees}
            actor={actor}
            hrefActif={active?.href ?? null}
            replie={replie}
            onBasculerReplie={basculerRetraction}
            logo={logo}
            logoWhite={logoWhite}
          />
        </aside>

        {/* --- Tiroir, en dessous de 1024 px ------------------------------ */}
        <SheetContent
          side="left"
          // Le bouton natif fait 36 px ; la barre latérale en fournit un de
          // 44 px dans son en-tête (règle 4 du §12).
          showCloseButton={false}
          // `h-dvh` et non la hauteur par défaut : le bas du tiroir ne doit
          // pas passer sous la barre d'adresse mobile.
          className="gap-0 p-0 data-[side=left]:h-dvh lg:hidden"
        >
          {/*
            Radix exige un titre accessible sur tout Dialog. Il est en
            `sr-only` : le tiroir affiche le logo, pas un intitulé redondant.
          */}
          <SheetHeader className="sr-only">
            <SheetTitle>Navigation de gestion</SheetTitle>
            <SheetDescription>
              Accès aux écrans de gestion du site ADEBES.
            </SheetDescription>
          </SheetHeader>

          <Sidebar
            variante="tiroir"
            entrees={entrees}
            actor={actor}
            hrefActif={active?.href ?? null}
            logo={logo}
            logoWhite={logoWhite}
          />
        </SheetContent>

        {/* --- Barre supérieure et contenu -------------------------------- */}
        <div
          className={cn(
            "flex min-h-dvh flex-col transition-[padding] duration-200",
            replie ? DECALAGE_RETRACTE : DECALAGE_DEPLOYE,
          )}
        >
          <Topbar actor={actor} etapes={etapes} titreCourt={titreCourt} />

          {/*
            Aucun `min-width` sur cette zone : c'est la condition de la règle 2
            (« aucun défilement horizontal de page jusqu'à 320 px »). Un
            contenu large — tableau, valeur JSON — défile dans son propre
            conteneur, jamais dans la page.

            `max-w-(--breakpoint-2xl)` = 96 rem, l'équivalent Tailwind v4 de
            l'ancien `max-w-screen-2xl` demandé au §5.3, retiré de la v4.
          */}
          <main className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
            <div className="mx-auto w-full max-w-(--breakpoint-2xl)">
              {children}
            </div>
          </main>
        </div>
      </div>
    </Sheet>
  );
}
