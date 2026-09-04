import { isBlockType } from "../../cms/entities/block-type";
import type { PageSection } from "../../cms/entities/page";
import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

import { BLOCS_UNIQUES_PAR_PAGE, MAX_SECTIONS_PAR_PAGE } from "./add-section";

/**
 * Duplique une section, juste en dessous de l'originale.
 *
 * ---------------------------------------------------------------------------
 * POURQUOI « JUSTE EN DESSOUS » ET NON « EN FIN DE PAGE »
 * ---------------------------------------------------------------------------
 * On duplique une section pour en faire une variante — deux blocs « Image +
 * texte » qui alternent, deux listes illustrées de forme identique. La copie
 * atterrissant vingt sections plus bas, il faudrait la remonter à la main,
 * c'est-à-dire refaire le geste qu'on voulait s'épargner.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  LA COPIE EST MASQUÉE, MÊME SI L'ORIGINALE EST VISIBLE
 * ---------------------------------------------------------------------------
 * Sans cela, dupliquer une section publiée met immédiatement en ligne un
 * doublon exact — deux fois le même titre, deux fois le même texte, sur une
 * page publique. C'est le seul état que personne ne veut jamais, alors que
 * chacun des deux autres (copie masquée à remplir, copie affichée après
 * modification) est atteignable en un clic depuis celui-ci.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  UN BLOC UNIQUE PAR PAGE NE SE DUPLIQUE PAS
 * ---------------------------------------------------------------------------
 * `page-hero` et `faq` sont refusés à l'ajout (voir `add-section.ts`) ; les
 * dupliquer contournerait exactement la même règle par une autre porte. Le
 * refus est ici formulé à partir de la définition du bloc, sans recopier la
 * liste — une seconde liste aurait fini par diverger de la première.
 */
export async function duplicateSection(
  deps: PageDeps,
  id: string,
): Promise<Result<PageSection>> {
  const section = await deps.sectionRead.findById(id);
  if (!section) {
    return err(new AppError("NOT_FOUND", "Cette section n'existe plus."));
  }

  if (!isBlockType(section.blockType)) {
    return err(
      new AppError(
        "VALIDATION",
        `Le type de bloc « ${section.blockType} » n'existe plus : cette section ne peut pas être dupliquée.`,
      ),
    );
  }

  const sections = await deps.sectionRead.findByPage(section.pageId);

  if (sections.length >= MAX_SECTIONS_PAR_PAGE) {
    return err(
      new AppError(
        "VALIDATION",
        `Cette page atteint ${MAX_SECTIONS_PAR_PAGE} sections, le maximum.`,
      ),
    );
  }

  /*
    L'unicité est lue dans la table d'`add-section.ts`, jamais recopiée : une
    seconde liste aurait fini par diverger, et le contournement se serait alors
    ouvert du côté qu'on aurait oublié de mettre à jour.
  */
  const raisonUnicite = BLOCS_UNIQUES_PAR_PAGE[section.blockType];
  if (raisonUnicite) {
    return err(new AppError("CONFLICT", raisonUnicite));
  }

  return ok(
    await deps.sectionWrite.insertAt(
      {
        pageId: section.pageId,
        blockType: section.blockType,
        content: section.content,
        // Voir l'avertissement ci-dessus : jamais un doublon en ligne.
        isVisible: false,
      },
      section.position + 1,
    ),
  );
}
