import {
  selectionAccueil,
  type FaqItem,
  type FaqTopic,
} from "../../cms/entities/faq-item";
import type { FaqItemReadPort } from "../../cms/ports/faq-item.port";
import {
  normalizeFilter,
  toPage,
  type ListFilter,
  type Page,
} from "../../shared/pagination";
import { ok, type Result } from "../../shared/result";

/**
 * Liste paginée des questions fréquentes, pour le dashboard.
 *
 * ⚠️  Ne reçoit qu'un `FaqItemReadPort` — pas les deux. Une lecture ne peut
 * structurellement pas écrire (§7 du Rapport 1, principe I).
 */
export async function listFaqItems(
  read: FaqItemReadPort,
  filter: ListFilter = {},
): Promise<Result<Page<FaqItem>>> {
  const normalise = normalizeFilter(filter);
  const [items, total] = await Promise.all([
    read.findAll(normalise),
    read.count(normalise),
  ]);
  return ok(toPage(items, total, normalise));
}

/**
 * Les questions publiées d'un sujet, dans l'ordre d'affichage — ce que rendent
 * « Faire un don » et « Devenir bénévole ».
 *
 * Le filtrage par statut est répété dans le dépôt alors que la RLS l'impose
 * déjà à la clé `anon` : les deux barrières sont indépendantes, et cette
 * fonction doit rester correcte même appelée avec un client authentifié.
 */
export async function listPublishedFaqItems(
  read: FaqItemReadPort,
  topic?: FaqTopic,
  limit = 100,
): Promise<Result<FaqItem[]>> {
  return ok(await read.findPublished({ topic, limit }));
}

/**
 * Les questions que l'accueil affiche.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI CETTE LECTURE EXISTE SÉPARÉMENT
 * ---------------------------------------------------------------------------
 * La règle de l'accueil n'est pas « un sujet » mais « tous SAUF le bénévolat,
 * et seulement les premières ». Aucun filtre du dépôt ne l'exprime : ce n'est
 * ni un `eq` ni un `limit`, puisque la coupe doit s'appliquer APRÈS
 * l'exclusion. Rapatrier les publiées puis appliquer `selectionAccueil()` est
 * la seule forme juste — et sur une FAQ, dont le volume se compte en dizaines,
 * elle est sans conséquence.
 *
 * ⚠️  La sélection elle-même vit dans l'entité, pas ici : l'écran du dashboard
 * doit pouvoir dire à quelqu'un « cette question figure parmi les quatre de
 * l'accueil », et une règle recopiée dans deux couches finit par diverger.
 */
export async function listFaqAccueil(
  read: FaqItemReadPort,
  max?: number,
): Promise<Result<FaqItem[]>> {
  const publiees = await read.findPublished();
  return ok(selectionAccueil(publiees, max));
}
