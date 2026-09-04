import type { Page } from "../../cms/entities/page";
import type { PageReadPort } from "../../cms/ports/page.port";
import type { ListFilter } from "../../shared/pagination";
import { ok, type Result } from "../../shared/result";

/**
 * La liste des pages du dashboard.
 *
 * ⚠️  Elle n'est PAS paginée, à la différence des neuf collections de la série
 * 8. Douze pages aujourd'hui, quelques dizaines au pire : une barre de
 * pagination sous douze lignes est du bruit, et `<DataTable>` sait très bien
 * afficher une liste complète.
 *
 * Le filtre reste accepté pour la recherche et le tri, qui eux servent dès la
 * dixième ligne.
 */
export async function listPages(
  read: PageReadPort,
  filter?: ListFilter,
): Promise<Result<Page[]>> {
  return ok(await read.findAll(filter));
}

/**
 * Le nombre de sections de chaque page, par identifiant.
 *
 * Une requête d'agrégat plutôt qu'une lecture des sections page par page :
 * douze pages auraient produit treize requêtes pour afficher une colonne de
 * nombres. Le dépôt le fait en une.
 */
export async function countSectionsByPage(
  read: PageReadPort,
): Promise<Result<Map<string, number>>> {
  return ok(await read.countSectionsByPage());
}
