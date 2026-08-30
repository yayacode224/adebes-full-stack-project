import type { CoreValue } from "../../cms/entities/core-value";
import type { CoreValueReadPort } from "../../cms/ports/core-value.port";
import {
  normalizeFilter,
  toPage,
  type ListFilter,
  type Page,
} from "../../shared/pagination";
import { ok, type Result } from "../../shared/result";

/**
 * Liste paginée des valeurs, pour le dashboard.
 *
 * ⚠️  Ne reçoit qu'un `CoreValueReadPort` — pas les deux. Une lecture ne peut
 * structurellement pas écrire (§7 du Rapport 1, principe I).
 *
 * ⚠️  `ListFilter.status` N'A AUCUN SENS SUR CETTE COLLECTION et le dépôt
 * l'ignore. Le champ appartient au vocabulaire commun des listes, hérité des
 * quatre collections à cycle éditorial ; `core_values` n'a pas de colonne
 * `status`. Passer `{ status: 'published' }` renvoie donc la liste ENTIÈRE, et
 * non zéro ligne — ce que la recette vérifie explicitement. Un filtre qui
 * ramènerait le vide serait bien pire qu'un filtre ignoré : il ferait croire à
 * une collection sans contenu.
 */
export async function listCoreValues(
  read: CoreValueReadPort,
  filter: ListFilter = {},
): Promise<Result<Page<CoreValue>>> {
  const normalise = normalizeFilter(filter);
  const [items, total] = await Promise.all([
    read.findAll(normalise),
    read.count(normalise),
  ]);
  return ok(toPage(items, total, normalise));
}

/**
 * Les valeurs affichées, dans l'ordre — ce que voient les DEUX pages publiques.
 *
 * Le filtrage est répété dans le dépôt alors que la RLS l'impose déjà à la clé
 * `anon` (`core_values_public_read ... using (is_visible)`) : les deux
 * barrières sont indépendantes, et cette fonction doit rester correcte même
 * appelée avec un client authentifié — ce qui arrivera au Lot 9, quand un bloc
 * « valeurs » sera prévisualisable depuis le dashboard.
 */
export async function listVisibleCoreValues(
  read: CoreValueReadPort,
  limit = 50,
): Promise<Result<CoreValue[]>> {
  return ok(await read.findVisible(limit));
}
