import type { Stat } from "../../cms/entities/stat";
import type { StatReadPort } from "../../cms/ports/stat.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Récupère un chiffre par son identifiant — écran d'édition du dashboard.
 *
 * ⚠️  Par `id`, PAS par `key`, alors même que la clé est unique et lisible.
 *
 * La distinction compte : `key` est un identifiant de DONNÉE, stable et
 * pratique dans une requête SQL ; `id` est l'identifiant de la LIGNE, celui que
 * porte l'URL du dashboard et celui que le reste du projet manipule. Ouvrir une
 * fiche par sa clé aurait introduit une seconde adresse pour la même ressource,
 * et deux façons d'écrire un lien vers elle.
 *
 * `findByKey` existe donc pour un seul usage — le contrôle d'unicité à la
 * création — et n'a pas de cas d'usage à lui.
 *
 * Il n'existe pas non plus de `getStatBySlug` : un chiffre n'a pas d'adresse
 * publique. C'est la quatrième collection du Lot 8 dans ce cas, après les
 * témoignages, l'équipe et les valeurs.
 */
export async function getStatById(
  read: StatReadPort,
  id: string,
): Promise<Result<Stat>> {
  const stat = await read.findById(id);
  if (!stat) {
    return err(new AppError("NOT_FOUND", "Ce chiffre n'existe plus."));
  }
  return ok(stat);
}
