import { BLOCK_DEFINITIONS } from "../../cms/blocks/registry";
import type { BlockType } from "../../cms/entities/block-type";
import type { PageSection } from "../../cms/entities/page";
import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/** Au-delà, l'arbre des sections cesse d'être navigable et la page devient lente. */
export const MAX_SECTIONS_PAR_PAGE = 40;

/**
 * Ajoute une section à une page.
 *
 * ---------------------------------------------------------------------------
 * LE CONTENU INITIAL VIENT DES `defaults` DU BLOC, JAMAIS D'UN OBJET VIDE
 * ---------------------------------------------------------------------------
 * C'est ce qui fait qu'une section fraîchement ajoutée est immédiatement
 * VALIDE, donc immédiatement rendue — vide de texte, mais pas cassée. Écrire
 * `{}` aurait produit une section que `parseContenu()` ne sauve que par la
 * fusion avec les défauts : cela fonctionne, mais la base porterait alors un
 * contenu qui ne dit rien de ce que la section est censée contenir, et le
 * moindre écart de fusion la ferait disparaître.
 *
 * ---------------------------------------------------------------------------
 * ⚠️  DEUX BLOCS SONT UNIQUES PAR PAGE, ET LE REFUS EST ICI
 * ---------------------------------------------------------------------------
 * `page-hero` rend le `<h1>` de la page : deux en produiraient deux, ce
 * qu'aucun rendu ne signale et qu'un audit d'accessibilité relève aussitôt.
 * `faq` émet un balisage `FAQPage` : deux sur une même URL est une erreur de
 * balisage structuré, et le Lot 8F a établi que ce balisage devait rester
 * exact.
 *
 * Le refus est formulé du point de vue de ce qu'il faut faire — modifier
 * l'existant — plutôt que de la règle enfreinte.
 */
export const BLOCS_UNIQUES_PAR_PAGE: Partial<Record<BlockType, string>> = {
  "page-hero":
    "Une page n'a qu'un seul en-tête, qui porte son titre principal. Modifiez celui qui existe déjà.",
  faq: "Une page n'a qu'une seule section de questions fréquentes : au-delà, le balisage envoyé aux moteurs de recherche devient incohérent. Ajoutez vos questions à la section existante.",
};

export async function addSection(
  deps: PageDeps,
  input: { pageId: string; blockType: BlockType; position: number | null },
): Promise<Result<PageSection>> {
  const page = await deps.read.findById(input.pageId);
  if (!page) {
    return err(new AppError("NOT_FOUND", "Cette page n'existe plus."));
  }

  const definition = BLOCK_DEFINITIONS[input.blockType];
  const sections = await deps.sectionRead.findByPage(page.id);

  if (sections.length >= MAX_SECTIONS_PAR_PAGE) {
    return err(
      new AppError(
        "VALIDATION",
        `Cette page atteint ${MAX_SECTIONS_PAR_PAGE} sections, le maximum. Découpez-la en plusieurs pages plutôt que de l'allonger.`,
      ),
    );
  }

  const raisonUnicite = BLOCS_UNIQUES_PAR_PAGE[input.blockType];
  if (
    raisonUnicite &&
    sections.some((section) => section.blockType === input.blockType)
  ) {
    return err(new AppError("CONFLICT", raisonUnicite));
  }

  const nouvelle = {
    pageId: page.id,
    blockType: input.blockType,
    content: definition.defaults,
    isVisible: true,
  };

  /*
    Ajout en fin de liste, ou insertion à une position donnée.

    `position` vaut `null` quand l'ajout vient du bouton du bas de l'arbre, et
    un rang quand il vient d'un « + » posé entre deux sections. Les deux
    chemins existent parce que l'insertion au milieu est le geste courant sur
    une page déjà construite — et parce que la faire par un ajout suivi d'un
    réordonnancement aurait laissé la section apparaître une seconde en bas de
    la page publique, entre les deux écritures.
  */
  if (input.position === null || input.position > sections.length) {
    return ok(
      await deps.sectionWrite.create({
        ...nouvelle,
        position: sections.length + 1,
      }),
    );
  }

  return ok(await deps.sectionWrite.insertAt(nouvelle, input.position));
}
