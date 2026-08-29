import {
  canTransition,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "../../cms/entities/content-status";
import type { Programme } from "../../cms/entities/programme";
import type { ProgrammeDeps } from "../../cms/ports/programme.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Fait passer un programme d'un état à un autre.
 *
 * Isolé de `updateProgramme` parce que publier n'est pas modifier : la
 * transition obéit à des règles propres, exige la permission
 * `programme:publish`, déclenche un instantané de version (Lot 12) et invalide
 * d'autres étiquettes de cache.
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission — ce n'est pas son rôle. Le
 * contrôle d'accès appartient à `createAction` (§6 du Rapport 1), et la base
 * le double avec le trigger `guard_publish` (ADB01). Ici, on ne valide que la
 * cohérence métier de la transition.
 */
export async function setProgrammeStatus(
  deps: ProgrammeDeps,
  input: { id: string; status: ContentStatus },
): Promise<Result<Programme>> {
  const existant = await deps.read.findById(input.id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce programme n'existe plus."));
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

  // Publier un programme incomplet produirait une page vide en ligne. La
  // vérification est faite ici plutôt qu'au schéma : un BROUILLON a le droit
  // d'être incomplet, c'est même sa raison d'être.
  if (input.status === "published") {
    const manquants = champsManquants(existant);
    if (manquants.length > 0) {
      return err(
        new AppError(
          "VALIDATION",
          `Ce programme ne peut pas être publié : il manque ${manquants.join(", ")}.`,
        ),
      );
    }
  }

  return ok(await deps.write.setStatus(existant.id, input.status));
}

/** Ce qu'un programme doit contenir pour être présentable au public. */
function champsManquants(programme: Programme): string[] {
  const manquants: string[] = [];
  if (!programme.summary.trim()) manquants.push("le résumé");
  if (programme.actions.length === 0) manquants.push("au moins une action");
  if (programme.publics.length === 0) manquants.push("au moins un public");
  if (!programme.benevolatLabel.trim()) manquants.push("le libellé de bénévolat");
  return manquants;
}
