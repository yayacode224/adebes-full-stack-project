import type { AnnualReport } from "../../cms/entities/annual-report";
import type { AnnualReportReadPort } from "../../cms/ports/annual-report.port";
import {
  normalizeFilter,
  toPage,
  type ListFilter,
  type Page,
} from "../../shared/pagination";
import { ok, type Result } from "../../shared/result";

/**
 * Liste paginée des rapports annuels, pour le dashboard.
 *
 * ⚠️  Ne reçoit qu'un `AnnualReportReadPort` — pas les deux. Une lecture ne peut
 * structurellement pas écrire (§7 du Rapport 1, principe I).
 */
export async function listAnnualReports(
  read: AnnualReportReadPort,
  filter: ListFilter = {},
): Promise<Result<Page<AnnualReport>>> {
  const normalise = normalizeFilter(filter);
  const [items, total] = await Promise.all([
    read.findAll(normalise),
    read.count(normalise),
  ]);
  return ok(toPage(items, total, normalise));
}

/**
 * Les rapports publiés, dans l'ordre d'affichage — ce que rend `/impact`.
 *
 * ---------------------------------------------------------------------------
 * LA LISTE ENTIÈRE, SANS COUPE — comme au Lot 8H
 * ---------------------------------------------------------------------------
 * Contrairement au Lot 8F, dont la lecture publique prend un sujet en
 * paramètre, et contrairement au Lot 8C, dont l'accueil ne montre que les trois
 * premiers témoignages : la section Documents affiche TOUS les rapports
 * publiés. Une association publie un rapport par an, la liste ne peut pas
 * devenir longue, et couper le plus ancien reviendrait à retirer du site un
 * document de transparence sans que personne l'ait décidé.
 *
 * La borne existe malgré tout (`limit`), et c'est une protection technique, pas
 * une règle éditoriale : elle empêche une lecture accidentellement non bornée.
 *
 * Le filtrage par statut est répété dans le dépôt alors que la RLS l'impose
 * déjà à la clé `anon` : les deux barrières sont indépendantes, et cette
 * fonction doit rester correcte même appelée avec un client authentifié.
 */
export async function listPublishedAnnualReports(
  read: AnnualReportReadPort,
  limit = 100,
): Promise<Result<AnnualReport[]>> {
  return ok(await read.findPublished({ limit }));
}
