import type { PageDeps } from "../../cms/ports/page.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Réordonne les sections d'UNE page.
 *
 * Reçoit la liste entière dans le nouvel ordre, comme les neuf
 * réordonnancements de la série 8, et pour les mêmes raisons : une seule
 * transaction, et deux personnes qui réordonnent en même temps produisent
 * chacune un ordre complet et cohérent plutôt que deux décalages qui se
 * composent en un ordre que personne n'a voulu.
 *
 * ═══════════════════════════════════════════════════════════════════════════
 *  ⚠️  LA VÉRIFICATION D'APPARTENANCE EST PROPRE À CE LOT, ET ELLE EST VITALE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * `reorder_rows()` (§3.4) renumérote par identifiants, **sans notion de
 * parent**. C'est correct sur les neuf collections de la série 8, dont les
 * positions sont globales. Ce ne l'est pas ici : les positions de
 * `page_sections` sont relatives à une page.
 *
 * Une liste mêlant les sections de deux pages renumérotrait les deux, en
 * silence et sans erreur SQL. La page voisine se retrouverait réordonnée par
 * quelqu'un qui n'a jamais ouvert son écran, et rien dans le journal d'audit
 * ne le dirait — l'entrée porterait le nom de la page éditée.
 *
 * C'est aussi pourquoi la découverte nº 60 vaut doublement pour la recette de
 * ce lot : une suite qui exerce « Descendre » sur une page réordonne la table
 * entière si elle se trompe de liste. Relever l'ordre à l'entrée, le rétablir à
 * la sortie.
 */
export async function reorderSections(
  deps: PageDeps,
  input: { pageId: string; orderedIds: string[] },
): Promise<Result<void>> {
  if (input.orderedIds.length === 0) {
    return err(new AppError("VALIDATION", "Aucune section à réordonner."));
  }

  // Un identifiant en double renumérote deux lignes à la même position et rend
  // l'ordre non déterministe à la lecture suivante.
  if (new Set(input.orderedIds).size !== input.orderedIds.length) {
    return err(
      new AppError("VALIDATION", "La liste contient deux fois la même section."),
    );
  }

  const page = await deps.read.findById(input.pageId);
  if (!page) {
    return err(new AppError("NOT_FOUND", "Cette page n'existe plus."));
  }

  const connues = await deps.sectionRead.findByPage(input.pageId);
  const idsConnus = new Set(connues.map((section) => section.id));

  // Voir l'avertissement en tête de fichier : c'est CE contrôle qui empêche de
  // réordonner les sections d'une autre page.
  if (input.orderedIds.some((id) => !idsConnus.has(id))) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste contient une section qui n'appartient pas à cette page.",
      ),
    );
  }

  // La liste doit être exhaustive : une section absente garderait son ancienne
  // position et viendrait s'intercaler n'importe où. C'est le défaut le plus
  // probable si l'interface ne transmet que les sections visibles.
  if (input.orderedIds.length !== connues.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste doit contenir toutes les sections de la page, y compris celles qui sont masquées.",
      ),
    );
  }

  await deps.sectionWrite.reorder(input.orderedIds);
  return ok(undefined);
}
