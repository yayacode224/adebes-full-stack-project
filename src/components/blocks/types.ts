import type { ReactNode } from "react";
import type { z } from "zod";

import type { BLOCK_DEFINITIONS } from "@/core/cms/blocks/registry";
import type { BlockType } from "@/core/cms/entities/block-type";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LA MOITIÉ PRÉSENTATION DU DESCRIPTEUR DE BLOC
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * L'autre moitié de la coupure annoncée au Lot 6 (écart nº 41) : `core/` porte
 * ce qu'un bloc EST, cette couche porte comment il se DESSINE.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LE `Renderer` REÇOIT LA PAGE EN PLUS DU CONTENU — ÉCART AU §9.4
 * ---------------------------------------------------------------------------
 * Le §9.4 déclare `Renderer: ComponentType<{ content }>`. Deux blocs ne s'en
 * contentent pas :
 *
 *   * `page-hero` peut afficher un fil d'Ariane, qui se DÉDUIT du titre et de
 *     l'adresse de la page. Le saisir à la main garantissait qu'il finirait
 *     par contredire l'URL ;
 *   * plusieurs rendus composent une ancre ou un texte alternatif à partir du
 *     titre de la page.
 *
 * Recopier ces informations dans le contenu de chaque section aurait créé
 * autant de sources de vérité que de sections. La page est donc passée en
 * contexte, en LECTURE SEULE et réduite à trois champs : un `Renderer` ne doit
 * pas pouvoir dépendre du statut éditorial ni des dates de la page.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `Promise<ReactNode>` FAIT PARTIE DU TYPE, ET C'EST INDISPENSABLE
 * ---------------------------------------------------------------------------
 * Six des dix-sept rendus lisent une collection en base : ce sont des Server
 * Components asynchrones. `ComponentType` du §9.4 ne les accepte pas — une
 * fonction qui rend une promesse n'est pas un `ComponentType`.
 *
 * Le type est donc élargi plutôt que les rendus contraints. L'inverse aurait
 * demandé à chaque bloc de collection de recevoir ses données d'un appelant
 * qui, lui, ne sait pas de quel bloc il s'agit.
 */

/** Ce qu'un `Renderer` sait de la page qui l'accueille. Rien de plus. */
export type ContextePage = {
  slug: string;
  route: string;
  title: string;
};

/** Le contenu validé d'un bloc, déduit de son schéma. */
export type ContenuDeBloc<T extends BlockType> = z.infer<
  (typeof BLOCK_DEFINITIONS)[T]["schema"]
>;

export type ProprietesDeRendu<T> = {
  content: T;
  page: ContextePage;
};

export type RenduDeBloc<T> = (
  proprietes: ProprietesDeRendu<T>,
) => ReactNode | Promise<ReactNode>;

/**
 * Le registre de présentation : un rendu par type de bloc.
 *
 * ⚠️  Type MAPPÉ et non `Record<BlockType, …>` : c'est ce qui lie chaque
 * `Renderer` au schéma de SON bloc. Un rendu branché sur la mauvaise entrée ne
 * compile pas — la garantie n'existe que parce que `BLOCK_DEFINITIONS` est
 * déclaré avec `satisfies` (voir son en-tête).
 */
export type RegistreDeRendus = {
  [T in BlockType]: RenduDeBloc<ContenuDeBloc<T>>;
};
