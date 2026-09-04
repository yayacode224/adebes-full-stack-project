import { parseContenu } from "../../cms/blocks/registry";
import {
  CONTENT_STATUS_LABELS,
  canTransition,
  type ContentStatus,
} from "../../cms/entities/content-status";
import { contientMarqueur, type Page } from "../../cms/entities/page";
import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Fait passer une page d'un état éditorial à un autre.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  DEUX GARDES À LA PUBLICATION, ET ELLES NE DISENT PAS LA MÊME CHOSE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * **1. Aucune section invalide.** Une section dont le contenu ne passe pas le
 * schéma de son bloc n'est pas rendue (§9.4) : publier la page reviendrait à
 * mettre en ligne une page amputée sans que rien ne le dise. Le message nomme
 * la position et le bloc concernés — « la 3ᵉ section (Grille de valeurs) » —
 * parce qu'un identifiant technique n'aide personne à retrouver la section dans
 * l'arbre.
 *
 * ⚠️  Une section MASQUÉE est exclue de cette garde. Elle n'ira pas sur le
 * site : bloquer la publication d'une page entière à cause d'un brouillon
 * volontairement masqué aurait rendu le masquage inutilisable.
 *
 * **2. Aucun « [À COMPLÉTER] » dans une section visible.** Même garde qu'au
 * Lot 8D pour les fiches d'équipe, et pour la même raison : le seed a repris
 * les marqueurs du contenu d'origine tels quels, et les publier reviendrait à
 * mettre un gabarit en ligne. `contientMarqueur()` descend dans le JSONB — les
 * marqueurs de `feature-list` vivent deux niveaux sous la racine.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UNE PAGE SANS AUCUNE SECTION VISIBLE PEUT ÊTRE PUBLIÉE
 * ---------------------------------------------------------------------------
 * Contrairement aux deux gardes ci-dessus, ce cas n'est PAS refusé, et
 * l'arbitrage mérite d'être écrit : une page vide est un état légitime
 * pendant la construction du site, et neuf des douze pages actuelles portent
 * des sections squelettes vides qu'il faudra pouvoir publier au fil de leur
 * remplissage. L'écran avertit ; il ne bloque pas.
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission — c'est le rôle de
 * `createAction` (§6 du Rapport 1), doublé par le trigger `guard_publish`.
 */
export async function setPageStatus(
  deps: PageDeps,
  input: { id: string; status: ContentStatus },
): Promise<Result<Page>> {
  const page = await deps.read.findById(input.id);
  if (!page) {
    return err(new AppError("NOT_FOUND", "Cette page n'existe plus."));
  }

  // Rejouer la même transition n'est pas une erreur : deux clics, ou deux
  // onglets, ne doivent pas produire un échec alors que le résultat voulu est
  // déjà atteint.
  if (page.status === input.status) {
    return ok(page);
  }

  if (!canTransition(page.status, input.status)) {
    return err(
      new AppError(
        "VALIDATION",
        `Une page « ${CONTENT_STATUS_LABELS[page.status]} » ne peut pas passer directement à « ${CONTENT_STATUS_LABELS[input.status]} ».`,
      ),
    );
  }

  if (input.status === "published") {
    const sections = await deps.sectionRead.findByPage(page.id);
    const visibles = sections.filter((section) => section.isVisible);

    for (const section of visibles) {
      const analyse = parseContenu(section.blockType, section.content);
      if (!analyse.ok) {
        return err(
          new AppError(
            "VALIDATION",
            `La ${section.position}ᵉ section de cette page ne peut pas être affichée : ${analyse.message} Corrigez-la ou masquez-la avant de publier.`,
          ),
        );
      }
    }

    const incomplete = visibles.find((section) =>
      contientMarqueur(section.content),
    );
    if (incomplete) {
      return err(
        new AppError(
          "VALIDATION",
          `La ${incomplete.position}ᵉ section contient encore « [À COMPLÉTER] ». Renseignez le texte manquant, ou masquez la section, avant de publier la page.`,
        ),
      );
    }
  }

  return ok(await deps.write.setStatus(input.id, input.status));
}
