import type { Stat } from "../../cms/entities/stat";
import type { StatReadPort } from "../../cms/ports/stat.port";
import {
  normalizeFilter,
  toPage,
  type ListFilter,
  type Page,
} from "../../shared/pagination";
import { ok, type Result } from "../../shared/result";

/**
 * Liste paginée des chiffres clés, pour le dashboard.
 *
 * ⚠️  Ne reçoit qu'un `StatReadPort` — pas les deux. Une lecture ne peut
 * structurellement pas écrire (§7 du Rapport 1, principe I).
 *
 * ⚠️  `ListFilter.status` N'A AUCUN SENS SUR CETTE COLLECTION et le dépôt
 * l'ignore (écart nº 109, seconde occurrence). `stats` n'a pas de colonne
 * `status`. Passer `{ status: 'published' }` renvoie donc la liste ENTIÈRE, et
 * non zéro ligne : un écran vide ne se distingue pas d'une collection vide.
 */
export async function listStats(
  read: StatReadPort,
  filter: ListFilter = {},
): Promise<Result<Page<Stat>>> {
  const normalise = normalizeFilter(filter);
  const [items, total] = await Promise.all([
    read.findAll(normalise),
    read.count(normalise),
  ]);
  return ok(toPage(items, total, normalise));
}

/**
 * Les chiffres affichés, dans l'ordre — ce que voient les DEUX pages publiques.
 *
 * Le filtrage est répété dans le dépôt alors que la RLS l'impose déjà à la clé
 * `anon` (`stats_public_read ... using (is_visible)`) : les deux barrières sont
 * indépendantes, et cette fonction doit rester correcte même appelée avec un
 * client authentifié — ce qui arrivera au Lot 9, quand le bloc `stats-grid`
 * sera prévisualisable depuis le dashboard.
 *
 * ⚠️  ELLE NE FILTRE PAS LES CHIFFRES SANS VALEUR. Un chiffre à `null` est
 * affiché, avec « — » et sa mention : c'est l'invariant nº 1, et c'est
 * exactement ce que fait le site aujourd'hui pour `beneficiaires`. Le masquer
 * aurait été plus « propre » à l'œil, et malhonnête — la carte disparue, plus
 * rien ne dirait que l'association suit cet indicateur sans pouvoir encore le
 * chiffrer.
 */
export async function listVisibleStats(
  read: StatReadPort,
  limit = 50,
): Promise<Result<Stat[]>> {
  return ok(await read.findVisible(limit));
}
