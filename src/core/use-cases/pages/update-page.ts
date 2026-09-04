import type { Page, UpdatePage } from "../../cms/entities/page";
import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Modifie les réglages d'une page : titre, adresse, référencement.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  L'ADRESSE D'UNE PAGE SYSTÈME EST VERROUILLÉE
 * ---------------------------------------------------------------------------
 * C'est la garde centrale de ce cas d'usage, et elle n'a pas d'équivalent dans
 * la série 8. Renommer `/a-propos` en `/qui-sommes-nous` depuis le dashboard
 * produirait, en une écriture :
 *
 *   * une page en base à `/qui-sommes-nous` que rien ne sert — le fichier de
 *     route s'appelle toujours `a-propos/` ;
 *   * une page servie à `/a-propos` dont le contenu a disparu ;
 *   * trois liens morts dans la navigation, le pied de page et le plan du
 *     site, qui pointent tous vers l'ancienne adresse.
 *
 * L'invariant nº 2 du projet — aucun lien mort — est directement en jeu. Le
 * `slug` est verrouillé pour la même raison : c'est lui qui compose l'étiquette
 * de cache (`cms:page:a-propos`) que les Server Actions invalident.
 *
 * Le TITRE et le référencement, eux, restent modifiables sur une page système :
 * ce sont des données de contenu, pas des données de routage. C'est même le
 * principal intérêt de l'écran pour les douze pages existantes.
 */
export async function updatePage(
  deps: PageDeps,
  id: string,
  input: UpdatePage,
): Promise<Result<Page>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette page n'existe plus."));
  }

  const changeRoute =
    input.route !== undefined && input.route.trim() !== existante.route;
  const changeSlug =
    input.slug !== undefined && input.slug.trim() !== existante.slug;

  if (existante.isSystem && (changeRoute || changeSlug)) {
    const champs: Record<string, string> = {};
    if (changeRoute) champs.route = "Adresse verrouillée sur cette page.";
    if (changeSlug) champs.slug = "Identifiant verrouillé sur cette page.";

    return err(
      new AppError(
        "VALIDATION",
        "L'adresse d'une page de la structure du site ne peut pas être modifiée : le site ne saurait plus où la servir. Son titre et son référencement restent modifiables.",
        champs,
      ),
    );
  }

  if (changeRoute) {
    const occupant = await deps.read.findByRoute(input.route!.trim());
    if (occupant && occupant.id !== id) {
      return err(
        new AppError(
          "CONFLICT",
          `L'adresse « ${input.route!.trim()} » est déjà utilisée par la page « ${occupant.title} ».`,
          { route: "Cette adresse est déjà prise." },
        ),
      );
    }
  }

  if (changeSlug) {
    const occupant = await deps.read.findBySlug(input.slug!.trim());
    if (occupant && occupant.id !== id) {
      return err(
        new AppError(
          "CONFLICT",
          `L'identifiant « ${input.slug!.trim()} » est déjà utilisé par la page « ${occupant.title} ».`,
          { slug: "Cet identifiant est déjà pris." },
        ),
      );
    }
  }

  return ok(await deps.write.update(id, input));
}
