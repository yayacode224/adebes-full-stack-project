import type { AnnualReport } from "../../cms/entities/annual-report";
import type { AnnualReportReadPort } from "../../cms/ports/annual-report.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Récupère un rapport annuel par son identifiant — écran d'édition.
 *
 * Il n'existe pas de `getAnnualReportBySlug` : un rapport n'a pas d'adresse
 * publique. C'est la sixième collection du Lot 8 dans ce cas, après les
 * témoignages, l'équipe, les valeurs, la FAQ et la galerie.
 *
 * ⚠️  Et pas non plus de `getAnnualReportByYear` exposé au dashboard, bien que
 * le port sache le faire : `findByYear` sert à REFUSER un doublon, pas à
 * naviguer. L'exposer aurait donné une seconde façon d'atteindre une fiche,
 * avec sa propre 404 à écrire, pour un besoin qui n'existe pas — la liste est
 * la seule porte d'entrée.
 */
export async function getAnnualReportById(
  read: AnnualReportReadPort,
  id: string,
): Promise<Result<AnnualReport>> {
  const rapport = await read.findById(id);
  if (!rapport) {
    return err(new AppError("NOT_FOUND", "Ce rapport annuel n'existe plus."));
  }
  return ok(rapport);
}
