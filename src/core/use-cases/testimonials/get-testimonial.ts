import type { Testimonial } from "../../cms/entities/testimonial";
import type { TestimonialReadPort } from "../../cms/ports/testimonial.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Récupère un témoignage par son identifiant — écran d'édition du dashboard.
 *
 * Il n'existe pas de `getTestimonialBySlug` : un témoignage n'a pas d'adresse
 * publique. C'est la seule collection du Lot 8 dans ce cas, et c'est aussi
 * pourquoi la fiche du dashboard n'offre pas de bouton « Voir sur le site »
 * pointant vers une page dédiée.
 */
export async function getTestimonialById(
  read: TestimonialReadPort,
  id: string,
): Promise<Result<Testimonial>> {
  const temoignage = await read.findById(id);
  if (!temoignage) {
    return err(new AppError("NOT_FOUND", "Ce témoignage n'existe plus."));
  }
  return ok(temoignage);
}
