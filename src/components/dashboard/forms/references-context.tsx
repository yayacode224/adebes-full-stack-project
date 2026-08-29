"use client";

import { createContext, useContext, type ReactNode } from "react";

import type { Resource } from "@/core/rbac/permissions";

/**
 * Les entités sélectionnables par un champ `kind: 'reference'`.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ÉCART ASSUMÉ PAR RAPPORT AU §6.2 DU RAPPORT 2
 * ═══════════════════════════════════════════════════════════════════════════
 * Le rapport décrit le champ `reference` comme un « sélecteur d'entité :
 * recherche + **chargement paresseux** ». Le chargement paresseux suppose un
 * point de lecture par ressource — or au Lot 6 il n'existe qu'un seul
 * repository (`programmes`, Lot 3) et aucune Server Action de lecture. Le
 * livrer maintenant reviendrait à câbler un appel réseau vers des routes qui
 * n'existent pas.
 *
 * Ce qui est livré à la place : **les options sont fournies par l'écran**, qui
 * les a déjà chargées côté serveur — c'est de toute façon la forme la plus
 * juste pour les volumes réels de ce site (8 programmes, 3 articles, 5
 * catégories). La recherche, elle, est bien là.
 *
 * Le jour où une collection dépassera quelques centaines d'entrées, ce
 * contexte est le point d'accroche : remplacer le tableau par une fonction
 * `(recherche: string) => Promise<OptionDeReference[]>` ne touchera aucun
 * écran qui passe déjà un tableau.
 *
 * Un champ `reference` dont la ressource est absente de ce contexte rend un
 * état « indisponible » explicite — jamais une liste vide, qui laisserait
 * croire qu'il n'y a rien à choisir (invariant nº 1, transposé aux relations).
 */
export type OptionDeReference = {
  value: string;
  label: string;
  /** Précision affichée en second : catégorie, statut, date. */
  detail?: string;
};

export type OptionsDeReference = Partial<Record<Resource, OptionDeReference[]>>;

const Contexte = createContext<OptionsDeReference>({});

export function ReferencesProvider({
  options,
  children,
}: {
  options: OptionsDeReference;
  children: ReactNode;
}) {
  return <Contexte.Provider value={options}>{children}</Contexte.Provider>;
}

export function useOptionsDeReference(
  resource: Resource,
): OptionDeReference[] | undefined {
  return useContext(Contexte)[resource];
}
