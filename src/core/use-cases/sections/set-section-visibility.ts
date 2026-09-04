import type { PageSection } from "../../cms/entities/page";
import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Affiche ou masque une section sur le site public.
 *
 * ---------------------------------------------------------------------------
 * MASQUER N'EST PAS SUPPRIMER, ET C'EST TOUTE LA DIFFÉRENCE
 * ---------------------------------------------------------------------------
 * La section reste en base, garde son contenu, garde sa position dans l'arbre
 * du dashboard. Elle disparaît seulement du rendu public. C'est ce que la
 * recette du lot vérifie explicitement, et c'est le geste à proposer chaque
 * fois que quelqu'un s'apprête à supprimer.
 *
 * Une méthode dédiée plutôt qu'un `update({ isVisible })`, pour la raison déjà
 * retenue neuf fois dans la série 8 : **retirer du site est une intention
 * distincte de corriger un texte.** Elle mérite son entrée d'audit et son
 * libellé de bouton.
 *
 * ⚠️  Elle ne mérite pas une permission distincte. Un éditeur a
 * `section:update` et peut donc masquer une section — alors qu'il ne peut
 * dépublier aucune page. La nuance est volontaire et vient de la matrice du
 * §9 : masquer une section est un geste de rédaction réversible, dépublier une
 * page est une décision éditoriale.
 */
export async function setSectionVisibility(
  deps: PageDeps,
  input: { id: string; isVisible: boolean },
): Promise<Result<PageSection>> {
  const section = await deps.sectionRead.findById(input.id);
  if (!section) {
    return err(new AppError("NOT_FOUND", "Cette section n'existe plus."));
  }

  // Rejouer le même état n'est pas une erreur : deux clics, ou deux onglets.
  if (section.isVisible === input.isVisible) {
    return ok(section);
  }

  return ok(
    await deps.sectionWrite.update(input.id, { isVisible: input.isVisible }),
  );
}
