import type { Testimonial } from "../../cms/entities/testimonial";
import type { TestimonialReadPort } from "../../cms/ports/testimonial.port";
import {
  normalizeFilter,
  toPage,
  type ListFilter,
  type Page,
} from "../../shared/pagination";
import { ok, type Result } from "../../shared/result";

/**
 * Liste paginée des témoignages, pour le dashboard.
 *
 * ⚠️  Ne reçoit qu'un `TestimonialReadPort` — pas les deux. Une lecture ne peut
 * structurellement pas écrire (§7 du Rapport 1, principe I).
 */
export async function listTestimonials(
  read: TestimonialReadPort,
  filter: ListFilter = {},
): Promise<Result<Page<Testimonial>>> {
  const normalise = normalizeFilter(filter);
  const [items, total] = await Promise.all([
    read.findAll(normalise),
    read.count(normalise),
  ]);
  return ok(toPage(items, total, normalise));
}

/**
 * Témoignages publiés, dans l'ordre d'affichage — ce que voit le site public.
 *
 * Le filtrage par statut est répété dans le dépôt alors que la RLS l'impose
 * déjà à la clé `anon` : les deux barrières sont indépendantes, et cette
 * fonction doit rester correcte même appelée avec un client authentifié.
 *
 * ⚠️  ELLE NE FILTRE PAS SUR `hasConsent`, et c'est délibéré — voir l'en-tête
 * de `src/server/queries/testimonials.query.ts`, où le raisonnement complet est
 * consigné avec l'état réel des données.
 */
export async function listPublishedTestimonials(
  read: TestimonialReadPort,
  limit = 100,
): Promise<Result<Testimonial[]>> {
  return ok(await read.findPublished(limit));
}
