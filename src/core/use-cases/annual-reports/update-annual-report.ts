import type {
  AnnualReport,
  UpdateAnnualReport,
} from "../../cms/entities/annual-report";
import type { AnnualReportDeps } from "../../cms/ports/annual-report.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Modifie un rapport annuel.
 *
 * Ne change PAS le statut : c'est `setAnnualReportStatus` qui s'en charge,
 * parce que la transition obéit à des règles propres et exige une autre
 * permission. Un cas d'usage, une intention (§7 du Rapport 1).
 *
 * L'identifiant est un paramètre distinct de la charge utile : il désigne la
 * cible, il n'en fait pas partie (écart nº 20).
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'ANNÉE EST MODIFIABLE, ET SON UNICITÉ EST REVÉRIFIÉE ICI
 * ---------------------------------------------------------------------------
 * Contrairement à `stats.key`, immuable après création (écart nº 124), l'année
 * d'un rapport se corrige : une faute de frappe sur un millésime est une faute
 * comme une autre, et rien d'autre ne pointe dessus — `year` n'est référencée
 * par aucune table, ne compose aucune URL et n'est pas une clé technique.
 *
 * La vérification exclut la ligne elle-même : sans ce `!==`, enregistrer un
 * rapport sans toucher à son année le déclarerait en conflit avec lui-même.
 * C'est le défaut classique de ce contrôle, et il ne se voit qu'à l'usage.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  RETIRER LE PDF EST UNE VALEUR, PAS UN OUBLI
 * ---------------------------------------------------------------------------
 * `documentMediaId: null` est transmis et écrit ; `documentMediaId: undefined`
 * signifie « champ non modifié ». C'est la distinction que fait le mapper, et
 * elle est le seul moyen d'exprimer « ce PDF était le mauvais fichier ».
 *
 * Conséquence dite à l'écran, jamais interdite : le rapport reste en ligne et
 * la page Impact repasse sa ligne en « En cours de préparation ». Aucun autre
 * lot ne pouvait faire cela — au 8H, retirer la photo d'un élément de galerie
 * était impossible, `media_id` étant `not null`.
 *
 * ---------------------------------------------------------------------------
 * CHANGER LE PDF D'UN RAPPORT EN LIGNE EST AUTORISÉ
 * ---------------------------------------------------------------------------
 * Même raisonnement qu'au Lot 8H : **aucun état n'est faux ici**. Remplacer un
 * PDF déposé par erreur, ou corriger un titre, se fait précisément par cette
 * modification — la refuser empêcherait la correction. La différence avec la
 * citation d'un témoignage (écart nº 82) reste entière : là, réécrire un
 * contenu publié faisait dire à une personne réelle quelque chose qu'elle
 * n'avait pas autorisé.
 */
export async function updateAnnualReport(
  deps: AnnualReportDeps,
  id: string,
  input: UpdateAnnualReport,
): Promise<Result<AnnualReport>> {
  const existant = await deps.read.findById(id);
  if (!existant) {
    return err(new AppError("NOT_FOUND", "Ce rapport annuel n'existe plus."));
  }

  if (input.year !== undefined && input.year !== existant.year) {
    const homonyme = await deps.read.findByYear(input.year);
    if (homonyme && homonyme.id !== existant.id) {
      return err(
        new AppError(
          "CONFLICT",
          `Un rapport existe déjà pour l'année ${input.year} : « ${homonyme.title} ».`,
          { year: "Cette année a déjà son rapport." },
        ),
      );
    }
  }

  // Le statut est neutralisé plutôt qu'ignoré silencieusement : un formulaire
  // qui renverrait l'entité complète ne doit pas publier par effet de bord.
  // Les repositories ne transmettent pas les champs `undefined`.
  const champs: UpdateAnnualReport = { ...input, status: undefined };

  return ok(await deps.write.update(existant.id, champs));
}
