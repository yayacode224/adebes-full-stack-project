import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

/**
 * En-tête d'écran du dashboard : titre, description, actions.
 *
 * ⚠️  Pas de `"use client"`. C'est délibéré : cet en-tête n'a aucun état, et
 * le laisser côté serveur permet aux écrans des lots suivants d'y placer
 * directement des boutons liés à des Server Actions sans faire basculer toute
 * la page côté client.
 *
 * ---------------------------------------------------------------------------
 * COMPORTEMENT RESPONSIVE (§5.3 du Rapport 2)
 * ---------------------------------------------------------------------------
 *   < 640 px : titre puis actions EMPILÉES pleine largeur, l'action primaire
 *              en premier — c'est le pouce qui commande, et il atteint le haut
 *              de la pile avant le bas ;
 *   ≥ 640 px : titre à gauche, actions à droite.
 *
 * ---------------------------------------------------------------------------
 * UNE SEULE ACTION PRIMAIRE PAR ÉCRAN (§12 du Rapport 1)
 * ---------------------------------------------------------------------------
 * Ce composant ne peut pas l'imposer techniquement — `actions` est un
 * `ReactNode`. La convention est donc écrite ici, et l'ordre compte : la
 * PREMIÈRE action passée est celle qui apparaît en tête de pile sur mobile.
 * Deux boutons `variant="default"` côte à côte sont une erreur de relecture.
 */
export function PageHeader({
  title,
  description,
  actions,
  className,
}: {
  title: string;
  /** Une phrase, pas un paragraphe : elle explique à quoi sert l'écran. */
  description?: string;
  /**
   * Boutons de l'écran, action primaire en premier.
   *
   * Sur mobile ils sont étirés pleine largeur par le conteneur : les composants
   * passés n'ont pas à porter `w-full` eux-mêmes.
   */
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between sm:gap-6",
        className,
      )}
    >
      <div className="min-w-0 space-y-1">
        {/*
          `h1` : chaque écran du dashboard n'a qu'un seul titre de niveau 1, et
          c'est celui-ci. Le titre court de la barre supérieure est un simple
          `span` — le dupliquer en `h1` donnerait deux titres de niveau 1 dans
          la même page.

          Deux lignes autorisées sous `sm:` (§12) : `text-balance` répartit la
          coupure plutôt que de laisser un mot orphelin.
        */}
        <h1 className="text-balance font-heading text-xl font-semibold tracking-tight sm:text-2xl">
          {title}
        </h1>

        {description ? (
          <p className="max-w-2xl text-sm text-muted-foreground">
            {description}
          </p>
        ) : null}
      </div>

      {actions ? (
        <div className="flex shrink-0 flex-col gap-2 sm:flex-row sm:items-center [&>*]:w-full sm:[&>*]:w-auto">
          {actions}
        </div>
      ) : null}
    </div>
  );
}
