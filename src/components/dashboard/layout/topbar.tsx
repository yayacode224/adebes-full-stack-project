"use client";

import { ChevronRight, LogOut, Menu, MoonStar, Sun } from "lucide-react";
import Link from "next/link";
import { useTheme } from "next-themes";
import { Fragment } from "react";

import { ROLE_LABELS, type Actor } from "@/core/rbac/roles";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { SheetTrigger } from "@/components/ui/sheet";
import { ThemeToggle } from "@/components/theme-toggle";
import type { FilArianeEtape } from "@/lib/dashboard-navigation";
import { signOutAction } from "@/server/actions/auth.actions";
import { cn } from "@/lib/utils";

import { initiales } from "./initiales";

/**
 * Barre supérieure du dashboard.
 *
 * Trois présentations, exactement celles du §5.3 du Rapport 2 :
 *
 * | Largeur      | Contenu                                                   |
 * |--------------|-----------------------------------------------------------|
 * | `< 768px`    | 56 px de haut : menu · titre court · menu utilisateur      |
 * | `768–1023px` | fil d'Ariane tronqué « … / niveau courant »                |
 * | `≥ 1024px`   | fil d'Ariane complet, thème, menu utilisateur              |
 *
 * Les trois sont obtenues en CSS. Aucun `window.innerWidth`, aucune bascule
 * conditionnelle en JavaScript (règle 9 du §12) : le même balisage est rendu
 * partout, les media queries décident de ce qui s'affiche.
 *
 * Le fil d'Ariane est masqué sous 768 px parce qu'il y serait redondant avec
 * le titre court — pas parce qu'il manquerait de place.
 */
export function Topbar({
  actor,
  etapes,
  titreCourt,
}: {
  actor: Actor;
  etapes: readonly FilArianeEtape[];
  /** Titre affiché sous 768 px, à la place du fil d'Ariane. */
  titreCourt: string;
}) {
  const derniere = etapes[etapes.length - 1];
  const intermediaires = etapes.slice(0, -1);

  return (
    <header className="sticky top-0 z-30 flex h-14 shrink-0 items-center gap-2 border-b border-border bg-background/90 px-3 backdrop-blur-md supports-[backdrop-filter]:bg-background/75 sm:px-4 md:h-16 lg:px-6">
      {/*
        Ouverture du tiroir. `SheetTrigger` et non un `onClick` : c'est ce qui
        garantit le renvoi du focus sur ce bouton à la fermeture du tiroir
        (Radix s'en charge), exigence explicite de la recette.
      */}
      <SheetTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0 lg:hidden"
          aria-label="Ouvrir le menu de gestion"
        >
          <Menu className="size-5" aria-hidden="true" />
        </Button>
      </SheetTrigger>

      {/* --- Titre court, sous 768 px --------------------------------------- */}
      <span className="min-w-0 flex-1 truncate font-heading text-base font-semibold md:hidden">
        {titreCourt}
      </span>

      {/* --- Fil d'Ariane, à partir de 768 px ------------------------------- */}
      <nav
        aria-label="Fil d'Ariane"
        className="hidden min-w-0 flex-1 md:block"
      >
        <ol className="flex min-w-0 items-center gap-1 text-sm">
          {/*
            De 768 à 1023 px, les niveaux intermédiaires cèdent la place à des
            points de suspension : « … / Navigation ». Purement décoratifs,
            donc `aria-hidden` — le lecteur d'écran, lui, reçoit la liste
            complète, qui reste dans le DOM.
          */}
          {intermediaires.length > 0 ? (
            <li aria-hidden="true" className="lg:hidden">
              <span className="text-muted-foreground">…</span>
              <ChevronRight
                className="ml-1 inline size-4 shrink-0 text-muted-foreground/70 align-[-0.2em]"
                aria-hidden="true"
              />
            </li>
          ) : null}

          {intermediaires.map((etape) => (
            <Fragment key={etape.href}>
              <li className="hidden lg:block">
                {/*
                  `min-h-11` = 44 px. Une étape de fil d'Ariane est un lien de
                  texte : sa hauteur naturelle est celle de sa police, soit
                  17 px — mesuré par la recette du Lot 7, qui a étendu le
                  contrôle des cibles tactiles à la coquille du dashboard.

                  La règle 4 du §12 ne fait aucune exception pour les grands
                  écrans (« une tablette tactile de 1024 px reste un écran
                  tactile »), et ce fil d'Ariane n'apparaît QU'À PARTIR de
                  768 px. La zone cliquable est donc agrandie sans que rien
                  bouge à l'écran : la barre fait déjà 64 px de haut.
                */}
                <Link
                  href={etape.href}
                  className="inline-flex min-h-11 items-center rounded-md px-1 text-muted-foreground transition-colors hover:text-foreground"
                >
                  {etape.label}
                </Link>
              </li>
              <li aria-hidden="true" className="hidden lg:block">
                <ChevronRight
                  className="size-4 shrink-0 text-muted-foreground/70"
                  aria-hidden="true"
                />
              </li>
            </Fragment>
          ))}

          {derniere ? (
            <li className="min-w-0">
              <span
                aria-current="page"
                className="block truncate font-medium text-foreground"
              >
                {derniere.label}
              </span>
            </li>
          ) : null}
        </ol>
      </nav>

      {/* --- Commandes ------------------------------------------------------ */}
      {/*
        Le sélecteur de thème n'apparaît en barre qu'à partir de 1024 px
        (§12). Il n'est pas pour autant supprimé en dessous : il est DÉPLACÉ
        dans le menu utilisateur — « masquer une action sans équivalent
        mobile » est un interdit explicite du §12.
      */}
      <ThemeToggle className="hidden shrink-0 lg:inline-flex" />

      <MenuUtilisateur actor={actor} />
    </header>
  );
}

function MenuUtilisateur({ actor }: { actor: Actor }) {
  const { resolvedTheme, setTheme } = useTheme();
  const nom = actor.fullName ?? actor.email;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          type="button"
          variant="ghost"
          size="icon"
          className="shrink-0"
          aria-label={`Compte de ${nom}`}
        >
          <span
            aria-hidden="true"
            className="flex size-8 items-center justify-center rounded-full bg-secondary text-xs font-semibold text-secondary-foreground"
          >
            {initiales(nom)}
          </span>
        </Button>
      </DropdownMenuTrigger>

      <DropdownMenuContent align="end" className="w-60">
        <DropdownMenuLabel className="px-2 py-2">
          <span className="block truncate text-sm font-medium text-foreground">
            {nom}
          </span>
          <span className="block truncate text-xs font-normal text-muted-foreground">
            {actor.email}
          </span>
          <span className="mt-1 block text-xs font-normal text-muted-foreground">
            {ROLE_LABELS[actor.role]}
          </span>
        </DropdownMenuLabel>

        <DropdownMenuSeparator />

        {/*
          Équivalent mobile du sélecteur de thème de la barre. Rendu à toutes
          les largeurs : une entrée de menu qui apparaît et disparaît selon la
          taille de l'écran déroute plus qu'elle ne sert.
        */}
        <DropdownMenuItem
          className={ELEMENT_MENU}
          onSelect={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          {/*
            Le thème résolu n'est pas connu au rendu serveur : les deux icônes
            sont rendues et une classe CSS choisit — même parade que
            `ThemeToggle`, aucun décalage d'hydratation.
          */}
          <MoonStar className="size-4 dark:hidden" aria-hidden="true" />
          <Sun className="hidden size-4 dark:block" aria-hidden="true" />
          <span className="dark:hidden">Passer au thème sombre</span>
          <span className="hidden dark:inline">Passer au thème clair</span>
        </DropdownMenuItem>

        <DropdownMenuSeparator />

        {/*
          La déconnexion reste une Server Action soumise par un formulaire, et
          non un lien : elle efface les cookies de session, et un préchargement
          de navigation sur un `GET` déconnecterait l'utilisateur au survol.
        */}
        <form action={signOutAction}>
          <DropdownMenuItem asChild variant="destructive">
            <button type="submit" className={cn(ELEMENT_MENU, "w-full")}>
              <LogOut className="size-4" aria-hidden="true" />
              Se déconnecter
            </button>
          </DropdownMenuItem>
        </form>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

/**
 * Les éléments de menu de shadcn sont en `py-1` (≈ 28 px de haut). La règle 4
 * du §12 impose 44 px à tous les points de rupture, y compris sur grand écran :
 * une tablette de 1024 px reste un écran tactile.
 */
const ELEMENT_MENU = "min-h-11 gap-2 px-2";
