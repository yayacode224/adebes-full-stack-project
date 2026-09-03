import type { AnnualReport } from "../../cms/entities/annual-report";
import {
  canTransition,
  CONTENT_STATUS_LABELS,
  type ContentStatus,
} from "../../cms/entities/content-status";
import type { AnnualReportDeps } from "../../cms/ports/annual-report.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Fait passer un rapport annuel d'un état à un autre.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️  IL N'Y A AUCUNE GARDE SUR LE DOCUMENT, ET C'EST LA DÉCISION DU LOT
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * Ce fichier est le jumeau visuel de `set-gallery-item-status.ts`, et c'est
 * précisément pour cela qu'il faut lire ce qui suit avant d'y ajouter quoi que
 * ce soit.
 *
 * Le Lot 8H refusait de publier un élément de galerie sans photo. La règle
 * était juste là-bas : `gallery_items.media_id` est `not null`, un élément sans
 * image n'existe pas, et l'état « publié sans photo » n'était atteignable que
 * par un import — auquel cas la base l'aurait refusé avec un message SQL.
 *
 * **Ici, `annual_reports.document_media_id` est NULLABLE.** Un rapport sans PDF
 * n'est pas un état dégradé : c'est un rapport annoncé, en préparation. C'est
 * même l'état des DEUX SEULES LIGNES qui existent en base, et c'est ce que la
 * page Impact affiche aujourd'hui — « Rapport d'activité 2025 · En cours de
 * préparation · Bientôt disponible ».
 *
 * Le §8I l'écrit noir sur blanc : « le comportement actuel (lien masqué si le
 * PDF est absent) est conservé, la vérification portant désormais sur
 * l'existence du média en base ». Le lien est MASQUÉ ; le rapport, lui, reste
 * affiché.
 *
 * Recopier la garde du Lot 8H aurait donc produit une règle qui **empêche de
 * publier les deux seuls rapports existants**, c'est-à-dire une régression
 * complète de la section Documents. C'est le genre de faute qu'un gabarit
 * appliqué sans le lire produit exactement une fois par série.
 *
 * ---------------------------------------------------------------------------
 * CE QUI RESTE VÉRIFIÉ, ET POURQUOI C'EST TOUT
 * ---------------------------------------------------------------------------
 * Les transitions du cycle éditorial, et rien d'autre. Le titre et l'année sont
 * `not null` en base et validés par le schéma à chaque écriture : il n'existe
 * aucun état FAUX qu'un rapport puisse atteindre et qu'une garde pourrait
 * intercepter ici.
 *
 * Comparaison utile, parce qu'elle explique la différence :
 *
 *   * Lot 8C — publier une citation sans consentement écrit : FAUX, la personne
 *     n'a rien autorisé. Garde.
 *   * Lot 8D — publier une fiche dont le nom est resté « [À COMPLÉTER] » :
 *     FAUX, un gabarit s'afficherait comme un nom. Garde.
 *   * Lot 8H — publier un élément de galerie sans photo : IMPOSSIBLE en base,
 *     et le message SQL serait illisible. Garde.
 *   * ici — publier un rapport sans PDF : **VRAI et voulu**. Pas de garde ;
 *     l'écran DIT ce qui sera affiché, à trois endroits (le bandeau de la
 *     liste, la phrase d'état de la fiche, la confirmation de publication).
 *
 * **Informer plutôt qu'interdire** — doctrine des Lots 8E à 8H, appliquée ici
 * au cas où elle se lit le plus facilement à l'envers.
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission — ce n'est pas son rôle. Le
 * contrôle d'accès appartient à `createAction` (§6 du Rapport 1), et la base le
 * double avec le trigger `annual_reports_guard_publish` (ADB01).
 */
export async function setAnnualReportStatus(
  deps: AnnualReportDeps,
  input: { id: string; status: ContentStatus },
): Promise<Result<AnnualReport>> {
  const existant = await deps.read.findById(input.id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce rapport annuel n'existe plus."));
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

  return ok(await deps.write.setStatus(existant.id, input.status));
}
