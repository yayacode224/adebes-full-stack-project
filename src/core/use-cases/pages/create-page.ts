import type { CreatePage, Page } from "../../cms/entities/page";
import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * Crée une page éditoriale.
 *
 * ---------------------------------------------------------------------------
 * DEUX UNICITÉS À VÉRIFIER, PAS UNE
 * ---------------------------------------------------------------------------
 * `slug` et `route` sont uniques séparément en base (migration 0006), et les
 * deux collisions se produisent pour des raisons différentes :
 *
 *   * deux titres proches donnent le même `slug` (« Nos actions » et « Nos
 *     Actions ») ;
 *   * deux slugs distincts peuvent viser la même `route` si l'un des deux a
 *     été saisi à la main.
 *
 * Les vérifier ici plutôt que de laisser remonter le `23505` du dépôt donne
 * deux messages distincts, chacun désignant le champ à corriger. Le dépôt reste
 * la garde réelle — deux créations simultanées passeraient les deux
 * vérifications — mais son message ne sait pas lequel des deux index a cédé.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE PAGE CRÉÉE ICI N'EST PAS SERVIE PAR LE SITE, ET IL FAUT LE SAVOIR
 * ---------------------------------------------------------------------------
 * Les douze pages du seed sont adossées à un fichier de route sous
 * `src/app/(site)/`. Une page créée depuis le dashboard n'en a pas : elle
 * existe en base, elle s'édite, elle se publie — et son adresse répond 404 tant
 * qu'aucune route dynamique ne la sert.
 *
 * Ce n'est pas un défaut de ce cas d'usage : c'est le périmètre du Lot 9, qui
 * livre le CONSTRUCTEUR de pages, pas le routage dynamique. Le Lot 15 branche
 * `src/app/(site)/[...segments]/page.tsx` sur `findPublishedByRoute()`, et
 * l'écran de création le dit d'ici là, en toutes lettres.
 */
export async function createPage(
  deps: PageDeps,
  input: CreatePage,
): Promise<Result<Page>> {
  const slug = input.slug?.trim() || slugify(input.title);
  if (!slug) {
    return err(
      new AppError(
        "VALIDATION",
        "Ce titre ne permet pas de composer une adresse. Saisissez-la vous-même.",
        { slug: "Adresse impossible à déduire du titre." },
      ),
    );
  }

  // `/mon-titre` par défaut. La racine `/` n'est jamais déduite : elle
  // appartient à la page d'accueil, qui existe déjà et qui est système.
  const route = input.route?.trim() || `/${slug}`;

  if (await deps.read.findBySlug(slug)) {
    return err(
      new AppError(
        "CONFLICT",
        `L'identifiant « ${slug} » est déjà utilisé par une autre page.`,
        { slug: "Cet identifiant est déjà pris." },
      ),
    );
  }

  if (await deps.read.findByRoute(route)) {
    return err(
      new AppError(
        "CONFLICT",
        `L'adresse « ${route} » est déjà utilisée par une autre page.`,
        { route: "Cette adresse est déjà prise." },
      ),
    );
  }

  return ok(await deps.write.create({ ...input, slug, route }));
}
