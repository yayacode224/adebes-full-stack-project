import {
  canTransition,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "../../cms/entities/content-status";
import type { Testimonial } from "../../cms/entities/testimonial";
import type { TestimonialDeps } from "../../cms/ports/testimonial.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Fait passer un témoignage d'un état à un autre.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  C'EST ICI QUE VIT LA RÈGLE ABSOLUE DU §8C
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * « Une citation n'est publiée que si la personne l'a réellement prononcée et
 * a donné son accord — pour le texte comme pour la photo »
 * (`src/content/temoignages.ts`).
 *
 * Le §8C la traduit par une case à cocher dans le formulaire. Une case à
 * cocher n'est qu'un pixel : elle se contourne par un POST direct sur la
 * Server Action, qui est une frontière publique. La règle est donc appliquée
 * ICI, dans le domaine, au seul endroit par lequel une mise en ligne peut
 * passer — et elle est vérifiée sur la donnée EN BASE, pas sur ce que la
 * requête prétend.
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission — ce n'est pas son rôle. Le
 * contrôle d'accès appartient à `createAction` (§6 du Rapport 1), et la base
 * le double avec le trigger `guard_publish` (ADB01). Ici, on ne valide que la
 * cohérence métier de la transition.
 */
export async function setTestimonialStatus(
  deps: TestimonialDeps,
  input: { id: string; status: ContentStatus },
): Promise<Result<Testimonial>> {
  const existant = await deps.read.findById(input.id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce témoignage n'existe plus."));
  }

  // Rejouer la même transition n'est pas une erreur : deux clics sur
  // « Publier », ou deux onglets ouverts, ne doivent pas produire un message
  // d'échec alors que le résultat voulu est déjà atteint.
  if (existant.status === input.status) {
    return ok(existant);
  }

  if (!canTransition(existant.status, input.status)) {
    return err(
      new AppError(
        "VALIDATION",
        `Un contenu « ${CONTENT_STATUS_LABELS[existant.status]} » ne peut pas passer directement à « ${CONTENT_STATUS_LABELS[input.status]} ».`,
      ),
    );
  }

  if (input.status === "published") {
    /*
      L'accord d'abord, et avec son propre message.

      Il aurait été plus court de le glisser dans `champsManquants` ci-dessous.
      Ce serait une faute : « il manque l'accord » ne se range pas à côté de
      « il manque le rôle ». L'un se corrige en tapant trois mots, l'autre
      demande de contacter quelqu'un et d'attendre sa réponse. Un message qui
      les met sur le même plan invite à cocher la case pour « débloquer » la
      publication.
    */
    if (!existant.hasConsent) {
      return err(
        new AppError(
          "VALIDATION",
          "Ce témoignage ne peut pas être mis en ligne : l'accord de la personne citée n'a pas été enregistré. Cochez la case d'accord dans la fiche une fois cet accord obtenu.",
        ),
      );
    }

    const manquants = champsManquants(existant);
    if (manquants.length > 0) {
      return err(
        new AppError(
          "VALIDATION",
          `Ce témoignage ne peut pas être publié : il manque ${manquants.join(", ")}.`,
        ),
      );
    }
  }

  return ok(await deps.write.setStatus(existant.id, input.status));
}

/**
 * Ce qu'un témoignage doit contenir pour être présentable au public.
 *
 * La photo n'en fait PAS partie : `media_assets` est encore vide et une carte
 * sans portrait reste parfaitement lisible — l'emplacement tenu par
 * `<MediaPlaceholder>` est prévu pour ça. Exiger une photo interdirait de
 * publier le moindre témoignage aujourd'hui.
 *
 * Le programme non plus : la colonne est nullable en base (migration 0005) et
 * un témoignage de partenaire peut ne concerner aucun programme en
 * particulier.
 */
function champsManquants(temoignage: Testimonial): string[] {
  const manquants: string[] = [];
  if (!temoignage.quote.trim()) manquants.push("la citation");
  if (!temoignage.authorName.trim()) manquants.push("le prénom de la personne");
  if (!temoignage.authorRole.trim()) manquants.push("son rôle");
  return manquants;
}
