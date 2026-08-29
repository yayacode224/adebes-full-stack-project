"use client";

import { X } from "lucide-react";
import { useState, type ReactNode } from "react";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { useIsDesktop } from "@/hooks/use-breakpoint";
import { cn } from "@/lib/utils";

import { ConfirmDialog } from "./confirm-dialog";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  MODALE DE CRÉATION / ÉDITION
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * LA SEULE BASCULE QUE LE CSS NE PEUT PAS FAIRE
 * ---------------------------------------------------------------------------
 * `Dialog` et `Sheet` sont deux arbres React différents, pas deux mises en
 * page du même. Le remplacement passe donc par `useIsDesktop()` — l'exception
 * assumée de la règle 9 du §12, et le seul endroit du dépôt où un point de
 * rupture est lu en JavaScript.
 *
 * Le hook rend `false` au premier rendu serveur (mobile d'abord). La
 * correction après montage est invisible : une modale n'est jamais ouverte au
 * chargement de la page, donc rien n'est peint avant que la valeur soit juste.
 * C'est exactement l'arbitrage retenu au §6.3.
 *
 * ---------------------------------------------------------------------------
 * SAUVEGARDE PROTÉGÉE — LES TROIS SORTIES PASSENT PAR LA MÊME PORTE
 * ---------------------------------------------------------------------------
 * Échap, clic à l'extérieur et croix aboutissent tous à `onOpenChange(false)`
 * chez Radix. En interceptant ce seul point, les trois obtiennent la même
 * confirmation dès que `isDirty` est vrai — sans avoir à traiter séparément
 * `onEscapeKeyDown` et `onPointerDownOutside`, où l'un des deux finit toujours
 * par être oublié.
 *
 * « Un bénévole qui perd vingt minutes de saisie n'y revient pas » (§12) : ce
 * n'est pas une politesse, c'est une condition d'adoption.
 *
 * ---------------------------------------------------------------------------
 * EN-TÊTE ET PIED FIXES, CORPS SEUL DÉFILANT
 * ---------------------------------------------------------------------------
 * C'est ce qui rend le formulaire utilisable au téléphone. Sans pied fixe,
 * « Enregistrer » se trouve au-delà de dix champs de défilement, et
 * l'utilisateur croit que le formulaire n'a pas de bouton.
 */
export function FormModal({
  open,
  onOpenChange,
  title,
  description,
  isDirty = false,
  footer,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (ouvert: boolean) => void;
  title: string;
  description?: string;
  /** `formState.isDirty` de react-hook-form. Déclenche la confirmation. */
  isDirty?: boolean;
  /** Boutons du pied. Action primaire en premier (voir `<PageHeader>`). */
  footer?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  const surBureau = useIsDesktop();
  const [confirmationOuverte, setConfirmationOuverte] = useState(false);

  /**
   * Point de sortie unique.
   *
   * Toute demande de fermeture — quelle qu'en soit l'origine — passe ici.
   * Ouvrir ne demande jamais confirmation.
   */
  function demanderChangement(ouvert: boolean) {
    if (ouvert) {
      onOpenChange(true);
      return;
    }
    if (isDirty) {
      setConfirmationOuverte(true);
      return;
    }
    onOpenChange(false);
  }

  const enTete = (
    <>
      <span className="font-heading text-base font-semibold text-foreground">
        {title}
      </span>
      {description ? (
        <span className="text-sm text-muted-foreground">{description}</span>
      ) : null}
    </>
  );

  /*
    Le pied respecte `env(safe-area-inset-bottom)` — la barre système d'un
    téléphone récent recouvrirait sinon le bouton « Enregistrer ». La classe
    `pb-action-bar` du site public n'est PAS réutilisée : elle est dimensionnée
    pour la StickyMobileActionBar, absente du dashboard (§12, règle 6).
  */
  const pied = footer ? (
    <div className="flex shrink-0 flex-col gap-2 border-t border-border bg-card px-4 py-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] sm:flex-row sm:justify-end sm:pb-3 [&>*]:w-full sm:[&>*]:w-auto">
      {footer}
    </div>
  ) : null;

  const corps = (
    <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 py-4">
      {children}
    </div>
  );

  const boutonFermer = (
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="-mr-1 shrink-0"
      aria-label="Fermer"
      onClick={() => demanderChangement(false)}
    >
      <X className="size-5" aria-hidden="true" />
    </Button>
  );

  const confirmation = (
    <ConfirmDialog
      open={confirmationOuverte}
      onOpenChange={setConfirmationOuverte}
      title="Quitter sans enregistrer ?"
      description="Les modifications que vous venez de faire seront perdues."
      confirmLabel="Quitter sans enregistrer"
      cancelLabel="Continuer la saisie"
      onConfirm={() => {
        setConfirmationOuverte(false);
        onOpenChange(false);
      }}
    />
  );

  /* ---------------------------------------------------------------------- */
  /* < 1024 px — `Sheet` plein écran, remontant du bas                       */
  /* ---------------------------------------------------------------------- */
  if (!surBureau) {
    return (
      <>
        <Sheet open={open} onOpenChange={demanderChangement}>
          <SheetContent
            side="bottom"
            showCloseButton={false}
            className={cn(
              // `h-dvh` et non `h-screen` : la barre d'adresse mobile
              // amputerait le pied, donc le bouton « Enregistrer ».
              "flex flex-col gap-0 rounded-none p-0 data-[side=bottom]:h-dvh",
              className,
            )}
          >
            <SheetHeader className="flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
              <SheetTitle asChild>
                <span className="flex min-w-0 flex-col gap-0.5">{enTete}</span>
              </SheetTitle>
              {/*
                `SheetDescription` est rendue en `sr-only` : le texte visible
                est déjà dans l'en-tête ci-dessus. Radix exige néanmoins une
                description associée, faute de quoi il avertit en console à
                chaque ouverture.
              */}
              <SheetDescription className="sr-only">
                {description ?? title}
              </SheetDescription>
              {boutonFermer}
            </SheetHeader>

            {corps}
            {pied}
          </SheetContent>
        </Sheet>

        {confirmation}
      </>
    );
  }

  /* ---------------------------------------------------------------------- */
  /* ≥ 1024 px — `Dialog` centré                                             */
  /* ---------------------------------------------------------------------- */
  return (
    <>
      <Dialog open={open} onOpenChange={demanderChangement}>
        <DialogContent
          showCloseButton={false}
          className={cn(
            // `max-h-[85dvh]` : la modale ne dépasse jamais la fenêtre, et
            // c'est le corps — pas la page — qui défile.
            "flex max-h-[85dvh] flex-col gap-0 p-0 sm:max-w-2xl",
            className,
          )}
        >
          <DialogHeader className="flex-row items-start justify-between gap-3 border-b border-border px-4 py-3">
            <DialogTitle asChild>
              <span className="flex min-w-0 flex-col gap-0.5">{enTete}</span>
            </DialogTitle>
            <DialogDescription className="sr-only">
              {description ?? title}
            </DialogDescription>
            {boutonFermer}
          </DialogHeader>

          {corps}
          {pied}
        </DialogContent>
      </Dialog>

      {confirmation}
    </>
  );
}
