"use client";

import { PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

import { ROLE_LABELS, type Actor } from "@/core/rbac/roles";
import { Button } from "@/components/ui/button";
import { SheetClose } from "@/components/ui/sheet";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  DASHBOARD_ICONS,
  DASHBOARD_NAV_GROUPS,
  DASHBOARD_NAV_GROUP_LABELS,
  entreesDuGroupe,
  type DashboardNavItem,
} from "@/lib/dashboard-navigation";
import { cn } from "@/lib/utils";

import { initiales } from "./initiales";

/**
 * Navigation principale du dashboard.
 *
 * Un seul composant sert les deux présentations du §5.3 :
 *
 *   * `variante="fixe"`   — colonne persistante ≥ 1024 px, rétractable à 72 px ;
 *   * `variante="tiroir"` — contenu du `Sheet` gauche sous 1024 px.
 *
 * Les dupliquer aurait garanti qu'un lien ajouté un jour n'existe que dans
 * l'une des deux — l'interdit « masquer une action sans équivalent mobile » du
 * §12, sous sa forme la plus discrète.
 *
 * ⚠️  `entrees` arrive DÉJÀ FILTRÉE par le layout (Server Component). Ce
 * composant ne connaît ni permission ni rôle : il ne peut donc pas afficher
 * par erreur une entrée interdite.
 */
export function Sidebar({
  entrees,
  actor,
  hrefActif,
  variante,
  replie = false,
  onBasculerReplie,
  logo,
  logoWhite,
}: {
  entrees: readonly DashboardNavItem[];
  actor: Actor;
  /** Href de l'entrée active, résolu une seule fois par la coquille. */
  hrefActif: string | null;
  variante: "fixe" | "tiroir";
  /** Ignoré en variante tiroir : un tiroir de 72 px n'aurait aucun sens. */
  replie?: boolean;
  onBasculerReplie?: () => void;
  logo: ReactNode;
  logoWhite: ReactNode;
}) {
  const dansTiroir = variante === "tiroir";
  // La rétraction n'existe que dans la colonne fixe.
  const compact = replie && !dansTiroir;

  return (
    <div className="flex h-full flex-col bg-sidebar text-sidebar-foreground">
      {/* ------------------------------------------------------------------ */}
      {/* En-tête : marque + bascule de rétraction                            */}
      {/* ------------------------------------------------------------------ */}
      <div
        className={cn(
          "flex h-14 shrink-0 items-center gap-2 border-b border-sidebar-border px-3 md:h-16",
          compact && "justify-center px-2",
        )}
      >
        {compact ? null : (
          <Link
            href="/dashboard"
            /*
              `min-h-11` = 44 px. Le logo fait 32 px de haut et `py-1` portait
              le lien à 40 px : quatre pixels sous la règle 4 du §12, relevés
              par la recette du Lot 7 qui a étendu le contrôle des cibles
              tactiles à la coquille du dashboard.

              L'en-tête de la barre latérale fait 56 px (64 à partir de
              `md:`) : la zone cliquable s'agrandit sans que rien ne bouge à
              l'écran.
            */
            className="flex min-h-11 min-w-0 flex-1 items-center rounded-md py-1"
            aria-label="ADEBES — retour au tableau de bord"
          >
            {/*
              Même principe que l'en-tête public : les deux teintes du logo
              sont rendues, une classe CSS décide laquelle s'affiche. Aucun
              état React, donc aucun clignotement au changement de thème.
            */}
            <span className="block h-8 dark:hidden">{logo}</span>
            <span className="hidden h-8 dark:block">{logoWhite}</span>
          </Link>
        )}

        {dansTiroir ? (
          /*
            Fermeture du tiroir. Le bouton natif de `SheetContent` est en
            `icon-sm` (36 px) : il est désactivé côté `<DashboardShell>` et
            remplacé ici par une cible de 44 px, libellée en français.
          */
          <SheetClose asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="shrink-0"
              aria-label="Fermer le menu de gestion"
            >
              <X className="size-5" aria-hidden="true" />
            </Button>
          </SheetClose>
        ) : (
          <Button
            type="button"
            variant="ghost"
            size="icon"
            className="shrink-0"
            aria-expanded={!compact}
            aria-label={
              compact
                ? "Déployer la barre latérale"
                : "Réduire la barre latérale"
            }
            onClick={onBasculerReplie}
          >
            {compact ? (
              <PanelLeftOpen className="size-5" aria-hidden="true" />
            ) : (
              <PanelLeftClose className="size-5" aria-hidden="true" />
            )}
          </Button>
        )}
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* Les entrées                                                         */}
      {/* ------------------------------------------------------------------ */}
      <TooltipProvider delayDuration={300}>
        <nav
          aria-label={
            dansTiroir
              ? "Navigation de gestion (tiroir)"
              : "Navigation de gestion"
          }
          className={cn(
            "flex-1 overflow-y-auto overscroll-contain px-2 py-3",
            compact && "px-1.5",
          )}
        >
          {DASHBOARD_NAV_GROUPS.map((groupe) => {
            const duGroupe = entreesDuGroupe(entrees, groupe);

            // Un groupe dont toutes les entrées sont filtrées disparaît avec
            // son intitulé : un éditeur ne voit pas une rubrique
            // « Administration » vide, qui lui apprendrait ce qu'il ignore.
            if (duGroupe.length === 0) return null;

            return (
              <div key={groupe} className="mb-4 last:mb-0">
                {compact ? (
                  // Le séparateur remplace l'intitulé : le regroupement reste
                  // perceptible sans texte tronqué à 72 px.
                  <hr
                    className="mx-2 mb-2 border-t border-sidebar-border first:hidden"
                    aria-hidden="true"
                  />
                ) : (
                  <h2 className="px-3 pb-1.5 text-[0.7rem] font-semibold uppercase tracking-wide text-muted-foreground">
                    {DASHBOARD_NAV_GROUP_LABELS[groupe]}
                  </h2>
                )}

                <ul className="flex flex-col gap-0.5">
                  {duGroupe.map((entree) => (
                    <li key={entree.href}>
                      <LienDeNavigation
                        entree={entree}
                        actif={entree.href === hrefActif}
                        compact={compact}
                        dansTiroir={dansTiroir}
                      />
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </nav>

        {/* ---------------------------------------------------------------- */}
        {/* Pied : qui est connecté                                           */}
        {/* ---------------------------------------------------------------- */}
        <IdentiteConnectee actor={actor} compact={compact} />
      </TooltipProvider>
    </div>
  );
}

/**
 * Un lien de la barre latérale.
 *
 * Deux points d'accessibilité, tous deux exigés par le §12 :
 *
 *   1. **44 px de haut minimum** (`min-h-11`) à tous les points de rupture.
 *   2. Rétracté, l'icône porte un `aria-label` — le `Tooltip` n'est qu'un
 *      complément visuel. Un libellé porté par le seul survol n'existe pas
 *      sur un écran tactile (règle 8).
 *
 * Dans le tiroir, chaque lien est enveloppé d'un `SheetClose` : la fermeture à
 * la navigation est obtenue par la structure, sans effet de bord sur le
 * changement de route — le §5.3 l'impose et un `useEffect` sur `pathname`
 * l'aurait fermé aussi lors d'une navigation déclenchée ailleurs.
 */
function LienDeNavigation({
  entree,
  actif,
  compact,
  dansTiroir,
}: {
  entree: DashboardNavItem;
  actif: boolean;
  compact: boolean;
  dansTiroir: boolean;
}) {
  // Accès par propriété, jamais par appel de fonction : voir le commentaire de
  // `DASHBOARD_ICONS` (règle `react-hooks/static-components`).
  const Icone = DASHBOARD_ICONS[entree.icon];

  const lien = (
    <Link
      href={entree.href}
      aria-current={actif ? "page" : undefined}
      // Rétracté, le texte est retiré du DOM : c'est l'attribut qui nomme
      // l'icône, pour le lecteur d'écran comme pour la recette.
      aria-label={compact ? entree.label : undefined}
      className={cn(
        "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium transition-colors",
        compact && "justify-center px-0",
        actif
          ? "bg-sidebar-accent text-sidebar-accent-foreground"
          : "text-sidebar-foreground/80 hover:bg-sidebar-accent/60 hover:text-sidebar-foreground",
      )}
    >
      <Icone
        className={cn("size-5 shrink-0", actif && "text-sidebar-primary")}
        aria-hidden="true"
      />
      {compact ? null : <span className="truncate">{entree.label}</span>}
    </Link>
  );

  const enveloppe = dansTiroir ? <SheetClose asChild>{lien}</SheetClose> : lien;

  if (!compact) return enveloppe;

  return (
    <Tooltip>
      <TooltipTrigger asChild>{enveloppe}</TooltipTrigger>
      <TooltipContent side="right">{entree.label}</TooltipContent>
    </Tooltip>
  );
}

/**
 * Bloc d'identité, en bas de la barre latérale.
 *
 * Purement informatif : les actions de compte (déconnexion) vivent dans le
 * menu utilisateur de la barre supérieure, atteignable à toutes les largeurs.
 * Le dupliquer ici donnerait deux boutons « Se déconnecter » à l'écran.
 */
function IdentiteConnectee({
  actor,
  compact,
}: {
  actor: Actor;
  compact: boolean;
}) {
  const nom = actor.fullName ?? actor.email;
  const role = ROLE_LABELS[actor.role];

  const pastille = (
    <span
      aria-hidden="true"
      className="flex size-9 shrink-0 items-center justify-center rounded-full bg-sidebar-primary text-xs font-semibold text-sidebar-primary-foreground"
    >
      {initiales(nom)}
    </span>
  );

  if (compact) {
    return (
      <div className="shrink-0 border-t border-sidebar-border p-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <div
              className="flex justify-center py-1"
              // Le bloc n'est pas interactif : `img` + `aria-label` le rend
              // annonçable sans le faire passer pour un bouton.
              role="img"
              aria-label={`Connecté : ${nom} — ${role}`}
            >
              {pastille}
            </div>
          </TooltipTrigger>
          <TooltipContent side="right">
            {nom} — {role}
          </TooltipContent>
        </Tooltip>
      </div>
    );
  }

  return (
    <div className="flex shrink-0 items-center gap-3 border-t border-sidebar-border px-3 py-3">
      {pastille}
      <span className="flex min-w-0 flex-col">
        <span className="truncate text-sm font-medium">{nom}</span>
        <span className="truncate text-xs text-muted-foreground">{role}</span>
      </span>
    </div>
  );
}
