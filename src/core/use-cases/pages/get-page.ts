import type { PageWithSections } from "../../cms/entities/page";
import type { PageReadPort, SectionReadPort } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Une page et TOUTES ses sections, pour l'écran d'édition.
 *
 * ⚠️  « toutes », y compris les sections MASQUÉES — c'est la différence avec
 * `getPagePubliee()`. La recette du lot l'exige explicitement : « une section
 * masquée disparaît du site mais reste dans le dashboard ». Une section qu'on
 * masque et qu'on ne retrouve plus est une section perdue.
 */
export async function getPage(
  deps: { read: PageReadPort; sectionRead: SectionReadPort },
  id: string,
): Promise<Result<PageWithSections>> {
  const page = await deps.read.findById(id);
  if (!page) {
    return err(new AppError("NOT_FOUND", "Cette page n'existe plus."));
  }

  const sections = await deps.sectionRead.findByPage(page.id);
  return ok({ ...page, sections });
}

/**
 * La page publiée servie à une adresse, sections visibles seulement.
 *
 * Le chemin le plus chaud du site : chaque page publique passe par lui. Une
 * seule requête, faite par le dépôt.
 *
 * Rend `NOT_FOUND` aussi bien pour une page absente que pour un brouillon. La
 * distinction n'intéresse pas le visiteur et la faire remonter laisserait
 * deviner, depuis l'extérieur, qu'un brouillon existe à cette adresse.
 */
export async function getPagePubliee(
  read: PageReadPort,
  route: string,
): Promise<Result<PageWithSections>> {
  const page = await read.findPublishedByRoute(route);
  if (!page) {
    return err(new AppError("NOT_FOUND", "Cette page n'existe pas."));
  }
  return ok(page);
}
