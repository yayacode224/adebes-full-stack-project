import {
  canTransition,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "../../cms/entities/content-status";
import type { FaqItem } from "../../cms/entities/faq-item";
import type { FaqItemDeps } from "../../cms/ports/faq-item.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Fait passer une question fréquente d'un état à un autre.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  PUBLIER UNE QUESTION, C'EST LA DÉCLARER AUX MOTEURS DE RECHERCHE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * C'est ce qui distingue cette collection des cinq précédentes. Une fiche
 * d'équipe publiée s'affiche sur une page ; une question publiée s'affiche
 * **et** entre dans le JSON-LD `FAQPage` de cette page — un contrat lisible
 * par une machine, qui affirme « l'association répond ceci à cette question ».
 *
 * D'où la garde ci-dessous, qui n'est pas décorative : une question ou une
 * réponse vide produirait une entrée `Question` sans `name` ou sans
 * `acceptedAnswer.text` utilisable. Le schéma l'interdit déjà à la saisie, mais
 * ce cas d'usage est la dernière barrière avant la mise en ligne, et il est
 * atteignable par un import ou une écriture directe en base — le seed du Lot 1
 * en est un exemple.
 *
 * ---------------------------------------------------------------------------
 * IL N'Y A PAS DE GARDE PROPRE AU LOT, ET C'EST UN CONSTAT, PAS UN OUBLI
 * ---------------------------------------------------------------------------
 * Les Lots 8C et 8D en portaient une, parce qu'un état FAUX était atteignable :
 * une citation sans accord, un marqueur affiché à la place d'un nom. Rien de
 * tel ici. Les sept questions du seed sont complètes, vraies, et déjà en
 * ligne ; aucune ne porte de gabarit ni de `[À COMPLÉTER]`.
 *
 * Chercher une garde à tout prix aurait conduit à en inventer une — refuser
 * une question qui ne finit pas par « ? », par exemple. Ce serait une règle que
 * ni la base, ni le métier, ni l'usage ne portent, et elle refuserait de
 * publier « Où intervenons-nous au Cameroun » pour un signe de ponctuation.
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission — ce n'est pas son rôle. Le
 * contrôle d'accès appartient à `createAction` (§6 du Rapport 1), et la base le
 * double avec le trigger `guard_publish` (ADB01).
 */
export async function setFaqItemStatus(
  deps: FaqItemDeps,
  input: { id: string; status: ContentStatus },
): Promise<Result<FaqItem>> {
  const existante = await deps.read.findById(input.id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette question n'existe plus."));
  }

  // Rejouer la même transition n'est pas une erreur : deux clics sur
  // « Publier », ou deux onglets ouverts, ne doivent pas produire un message
  // d'échec alors que le résultat voulu est déjà atteint.
  if (existante.status === input.status) {
    return ok(existante);
  }

  if (!canTransition(existante.status, input.status)) {
    return err(
      new AppError(
        "VALIDATION",
        `Un contenu « ${CONTENT_STATUS_LABELS[existante.status]} » ne peut pas passer directement à « ${CONTENT_STATUS_LABELS[input.status]} ».`,
      ),
    );
  }

  if (input.status === "published") {
    const manquants = champsManquants(existante);
    if (manquants.length > 0) {
      return err(
        new AppError(
          "VALIDATION",
          `Cette question ne peut pas être publiée : il manque ${manquants.join(" et ")}.`,
        ),
      );
    }
  }

  return ok(await deps.write.setStatus(existante.id, input.status));
}

/**
 * Ce qu'une question doit contenir pour être publiable.
 *
 * Les PUCES n'en font pas partie : cinq des sept questions du site n'en ont
 * aucune et se lisent parfaitement. Le SUJET non plus — la colonne est
 * `not null` avec une contrainte `check`, il ne peut pas être absent.
 */
function champsManquants(question: FaqItem): string[] {
  const manquants: string[] = [];
  if (!question.question.trim()) manquants.push("la question elle-même");
  if (!question.answer.trim()) manquants.push("la réponse");
  return manquants;
}
