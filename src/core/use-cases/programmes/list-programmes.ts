import type { Programme } from "../../cms/entities/programme";
import type { ProgrammeReadPort } from "../../cms/ports/programme.port";
import { ok, type Result } from "../../shared/result";
import { normalizeFilter, toPage, type ListFilter, type Page } from "../../shared/pagination";

/**
 * Liste paginée des programmes, pour le dashboard.
 *
 * ⚠️  Ne reçoit qu'un `ProgrammeReadPort` — pas les deux. Une lecture ne peut
 * structurellement pas écrire (§7 du Rapport 1, principe I).
 */
export async function listProgrammes(
  read: ProgrammeReadPort,
  filter: ListFilter = {},
): Promise<Result<Page<Programme>>> {
  const normalise = normalizeFilter(filter);
  const [items, total] = await Promise.all([
    read.findAll(normalise),
    read.count(normalise),
  ]);
  return ok(toPage(items, total, normalise));
}

/**
 * Programmes publiés, dans l'ordre d'affichage — ce que voit le site public.
 *
 * Le filtrage par statut est répété ici alors que la RLS l'impose déjà à la
 * clé `anon` : les deux barrières sont indépendantes, et cette fonction doit
 * rester correcte même appelée avec un client authentifié.
 */
export async function listPublishedProgrammes(
  read: ProgrammeReadPort,
): Promise<Result<Programme[]>> {
  const items = await read.findAll({
    status: "published",
    sortBy: "position",
    sortDirection: "asc",
    pageSize: 100,
  });
  return ok(items);
}
