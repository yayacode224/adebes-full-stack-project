import type { Programme, UpdateProgramme } from "../../cms/entities/programme";
import type { ProgrammeDeps } from "../../cms/ports/programme.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * Modifie un programme existant.
 *
 * Ne change PAS le statut : c'est `setProgrammeStatus` qui s'en charge, parce
 * que la transition obéit à des règles propres et exige une autre permission.
 * Un cas d'usage, une intention (§7 du Rapport 1).
 *
 * L'identifiant est un paramètre distinct de la charge utile : il désigne la
 * cible, il n'en fait pas partie. Le laisser dans `input` inviterait à l'écrire
 * en base, où il est immuable.
 */
export async function updateProgramme(
  deps: ProgrammeDeps,
  id: string,
  input: UpdateProgramme,
): Promise<Result<Programme>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce programme n'existe plus."));
  }

  // Le statut est neutralisé plutôt qu'ignoré silencieusement : un formulaire
  // qui renverrait l'entité complète ne doit pas publier par effet de bord.
  // Les repositories ne transmettent pas les champs `undefined`.
  const champs: UpdateProgramme = { ...input, status: undefined };

  // L'adresse n'est renormalisée que si elle a été touchée : réécrire un slug
  // publié casse les liens entrants et le référencement.
  if (input.slug !== undefined && input.slug !== existant.slug) {
    const slug = slugify(input.slug);

    if (!slug) {
      return err(
        new AppError("VALIDATION", "Cette adresse n'est pas valide.", {
          slug: "Adresse invalide.",
        }),
      );
    }

    const collision = await deps.read.findBySlug(slug);
    if (collision && collision.id !== existant.id) {
      return err(
        new AppError(
          "CONFLICT",
          `L'adresse « ${slug} » est déjà utilisée par un autre programme.`,
          { slug: "Cette adresse est déjà prise." },
        ),
      );
    }

    champs.slug = slug;
  } else {
    // Pas de changement demandé : on ne renvoie pas le slug du tout, plutôt que
    // de réécrire la même valeur.
    delete champs.slug;
  }

  return ok(await deps.write.update(existant.id, champs));
}
