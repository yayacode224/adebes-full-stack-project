import type {
  Testimonial,
  UpdateTestimonial,
} from "../../cms/entities/testimonial";
import type { TestimonialDeps } from "../../cms/ports/testimonial.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Modifie un témoignage existant.
 *
 * Ne change PAS le statut : c'est `setTestimonialStatus` qui s'en charge,
 * parce que la transition obéit à des règles propres et exige une autre
 * permission. Un cas d'usage, une intention (§7 du Rapport 1).
 *
 * L'identifiant est un paramètre distinct de la charge utile : il désigne la
 * cible, il n'en fait pas partie.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA RÈGLE PROPRE À CE LOT : ON NE RETIRE PAS L'ACCORD D'UNE CITATION EN
 * LIGNE
 * ---------------------------------------------------------------------------
 * Décocher la case de consentement sur un témoignage publié laisserait la
 * citation visible sur le site alors que la base dit que personne ne l'a
 * autorisée. C'est exactement la situation que la règle de
 * `src/content/temoignages.ts` existe pour empêcher.
 *
 * Trois issues étaient possibles ; celle retenue est la troisième :
 *
 *   1. l'accepter en silence — la pire : le site continue de publier une
 *      parole dont l'accord vient d'être retiré ;
 *   2. dépublier automatiquement — ce serait changer le statut depuis un cas
 *      d'usage de modification, ce que le projet interdit partout ailleurs, et
 *      surtout donner à un éditeur (`testimonial:update`) le moyen de retirer
 *      un contenu du site sans avoir `testimonial:publish` ;
 *   3. REFUSER, et dire quoi faire. La dépublication reste une décision
 *      explicite, prise par qui en a le droit.
 */
export async function updateTestimonial(
  deps: TestimonialDeps,
  id: string,
  input: UpdateTestimonial,
): Promise<Result<Testimonial>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce témoignage n'existe plus."));
  }

  // Le programme cité doit exister — même raison qu'à la création.
  if (input.programmeId) {
    const programme = await deps.programmes.findById(input.programmeId);
    if (!programme) {
      return err(
        new AppError(
          "VALIDATION",
          "Le programme choisi n'existe plus. Sélectionnez-en un autre.",
          { programmeId: "Ce programme n'existe plus." },
        ),
      );
    }
  }

  if (
    input.hasConsent === false &&
    existant.hasConsent &&
    existant.status === "published"
  ) {
    return err(
      new AppError(
        "VALIDATION",
        "Ce témoignage est en ligne : retirez-le du site avant de retirer l'accord de la personne citée.",
        {
          hasConsent: "Dépubliez le témoignage avant de décocher cette case.",
        },
      ),
    );
  }

  /*
    Le pendant de la règle précédente, et il vise un cas précis : les trois
    témoignages du seed sont EN LIGNE avec `has_consent = false` (voir
    `server/queries/testimonials.query.ts`). Ce sont des gabarits — « Prénom »,
    « Emplacement réservé au témoignage d'un bénéficiaire » — et rien
    n'interdit de les corriger.

    Mais réécrire LA CITATION de l'un d'eux sans quitter l'état publié, c'est
    mettre en ligne une parole nouvelle sans qu'aucun accord soit enregistré :
    le gabarit deviendrait, sans que personne ne s'en aperçoive, une vraie
    citation non autorisée. Exactement ce que `setTestimonialStatus` empêche à
    la publication, contourné par la porte de derrière.

    Deux sorties sont laissées ouvertes, et elles sont dans le message :
    enregistrer l'accord (`hasConsent: true` passe dans la même requête), ou
    dépublier. Tout le reste — le rôle, la photo, le programme cité — reste
    modifiable : ces champs ne changent pas ce que la personne est censée avoir
    dit.
  */
  if (
    existant.status === "published" &&
    !existant.hasConsent &&
    input.hasConsent !== true &&
    input.quote !== undefined &&
    input.quote.trim() !== existant.quote.trim()
  ) {
    return err(
      new AppError(
        "VALIDATION",
        "Ce témoignage est en ligne sans accord enregistré : cochez la case d'accord, ou dépubliez-le, avant d'en modifier la citation.",
        {
          quote:
            "Modification impossible tant que l'accord n'est pas enregistré.",
        },
      ),
    );
  }

  // Le statut est neutralisé plutôt qu'ignoré silencieusement : un formulaire
  // qui renverrait l'entité complète ne doit pas publier par effet de bord.
  // Les repositories ne transmettent pas les champs `undefined`.
  const champs: UpdateTestimonial = { ...input, status: undefined };

  return ok(await deps.write.update(existant.id, champs));
}
