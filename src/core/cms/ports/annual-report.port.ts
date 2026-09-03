import type { ListFilter } from "../../shared/pagination";
import type {
  AnnualReport,
  CreateAnnualReport,
  UpdateAnnualReport,
} from "../entities/annual-report";
import type { ContentStatus } from "../entities/content-status";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  PORTS DES RAPPORTS ANNUELS — la frontière entre le domaine et la persistance
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Même découpage lecture / écriture qu'aux Lots 8A à 8H (principe I de
 * SOLID) : une lecture publique reçoit un `AnnualReportReadPort` et rien
 * d'autre. Elle ne peut pas écrire — pas par convention, mais parce que le type
 * ne le permet pas.
 *
 * ---------------------------------------------------------------------------
 * UNE SEULE FAMILLE DE PORTS — contrairement aux Lots 8B et 8H
 * ---------------------------------------------------------------------------
 * Il n'y a pas de « catégories de documents » : `annual_reports` est une table
 * seule. Le patron « une collection dans la collection », qui a servi deux fois
 * (catégories d'articles, catégories de galerie), ne s'applique pas ici — et le
 * plaquer aurait créé une liste de libellés que rien n'affiche.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  `findByYear` EST LA SEULE MÉTHODE QUE LES HUIT AUTRES COLLECTIONS N'ONT
 *     PAS
 * ---------------------------------------------------------------------------
 * Elle est le pendant exact de `findBySlug` chez les programmes et les
 * articles : `year` est `integer not null unique` (migration 0005), donc
 * l'identifiant MÉTIER de la collection. Sans elle, un doublon d'année
 * remonterait en 23505, que `mapPostgrestError` traduit par « Cette adresse est
 * déjà utilisée » avec une erreur rattachée au champ `slug` — message faux, sur
 * un champ qui n'existe pas dans ce formulaire.
 */

export interface AnnualReportReadPort {
  findAll(filter?: ListFilter): Promise<AnnualReport[]>;
  findById(id: string): Promise<AnnualReport | null>;
  /**
   * Le rapport d'une année donnée, ou `null`.
   *
   * Sert à refuser un doublon EN LE NOMMANT, avant que la base ne le refuse
   * elle-même par un code que personne ne sait lire.
   */
  findByYear(year: number): Promise<AnnualReport | null>;
  count(filter?: ListFilter): Promise<number>;
  /**
   * Les rapports publiés, dans l'ordre d'affichage.
   *
   * Aucun paramètre de sélection, comme au Lot 8H : la section « Documents » de
   * `/impact` affiche la liste ENTIÈRE, sans filtre ni pagination — c'est le
   * comportement actuel du site, et une association publie un rapport par an.
   */
  findPublished(options?: { limit?: number }): Promise<AnnualReport[]>;
  /**
   * Combien de rapports pointent sur ce média ?
   *
   * Rien ne l'interdit en base — deux rapports peuvent référencer le même PDF —
   * mais ce serait presque sûrement une erreur de saisie : deux années
   * différentes ne partagent pas un rapport d'activité. L'écran le SIGNALE, il
   * ne l'interdit pas : doctrine des écarts nº 115 et nº 128.
   */
  countByMedia(mediaId: string): Promise<number>;
}

export interface AnnualReportWritePort {
  create(input: CreateAnnualReport): Promise<AnnualReport>;
  update(id: string, input: UpdateAnnualReport): Promise<AnnualReport>;
  delete(id: string): Promise<void>;
  /** Réordonne en UNE transaction — `reorder_rows('annual_reports')` (§3.4). */
  reorder(orderedIds: string[]): Promise<void>;
  setStatus(id: string, status: ContentStatus): Promise<AnnualReport>;
}

/**
 * Dépendances des cas d'usage qui écrivent.
 *
 * Pas de troisième port ici, contrairement au Lot 8H : il n'y a aucune
 * collection satellite à consulter. Le média, lui, n'est pas vérifié — voir
 * `create-annual-report.ts` pour le raisonnement, identique à celui du Lot 8H.
 */
export type AnnualReportDeps = {
  read: AnnualReportReadPort;
  write: AnnualReportWritePort;
};
