import type { Page } from "../../cms/entities/page";
import type { ContentVersionDeps } from "../../cms/ports/content-version.port";
import type { PageDeps } from "../../cms/ports/page.port";
import { pageSnapshotSchema } from "../../cms/schemas/content-version.schema";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { updatePage } from "../pages/update-page";
import { recordVersion } from "./record-version";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RESTAURER UNE PAGE DANS L'ÉTAT D'UNE VERSION ANTÉRIEURE (§12.2)
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * ---------------------------------------------------------------------------
 * CE QUI EST REMIS EN PLACE
 * ---------------------------------------------------------------------------
 *   * Réglages de page : titre, titre et description de référencement, image de
 *     partage. **Pas** l'adresse ni l'identifiant — verrouillés sur les douze
 *     pages système, et `updatePage` les refuserait de toute façon.
 *   * Pour chaque section ENCORE PRÉSENTE (même identifiant) : son contenu et
 *     sa visibilité.
 *
 * ---------------------------------------------------------------------------
 * CE QUI N'EST PAS TOUCHÉ, ET POURQUOI L'ÉCRAN LE DIT
 * ---------------------------------------------------------------------------
 * Les sections AJOUTÉES depuis l'instantané restent en place ; les sections
 * SUPPRIMÉES depuis ne sont pas recréées ; l'ORDRE n'est pas rétabli.
 *
 * Recréer une section supprimée lui donnerait un nouvel identifiant et une
 * place incertaine dans un arbre qui a changé ; réordonner un ensemble dont la
 * composition diffère produit des collisions de position. La restauration
 * couvre donc le cas réel et fréquent — « j'ai cassé le texte d'une section,
 * je le récupère » — et l'écran d'historique annonce la limite plutôt que de
 * la masquer. Le versionnage section par section est un lot de suivi.
 *
 * ⚠️  Ce cas d'usage ne vérifie AUCUNE permission — c'est le rôle de
 * `createAction` (`page:update`).
 */
export async function restorePageVersion(
  deps: { versions: ContentVersionDeps; pages: PageDeps },
  versionId: string,
  restoredBy: string | null,
): Promise<Result<Page>> {
  const version = await deps.versions.read.findById(versionId);
  if (!version) {
    return err(new AppError("NOT_FOUND", "Cette version n'existe plus."));
  }

  if (version.entityType !== "page") {
    return err(
      new AppError(
        "VALIDATION",
        "Cette version n'appartient pas à une page et ne peut pas être restaurée ici.",
      ),
    );
  }

  const analyse = pageSnapshotSchema.safeParse(version.snapshot);
  if (!analyse.success) {
    return err(
      new AppError(
        "VALIDATION",
        "L'instantané de cette version est illisible et ne peut pas être restauré.",
      ),
    );
  }
  const instantane = analyse.data;

  const cible = await deps.pages.read.findById(version.entityId);
  if (!cible) {
    return err(
      new AppError("NOT_FOUND", "La page associée à cette version n'existe plus."),
    );
  }

  const restauration = await updatePage(deps.pages, version.entityId, {
    title: instantane.title,
    metaTitle: instantane.metaTitle,
    metaDescription: instantane.metaDescription,
    ogMediaId: instantane.ogMediaId,
  });
  if (!restauration.ok) return restauration;

  // Sections : on ne touche que celles qui existent encore, repérées par
  // identifiant. `findByPage` donne l'état courant ; l'instantané donne la
  // cible.
  const sectionsCourantes = await deps.pages.sectionRead.findByPage(
    version.entityId,
  );
  const idsCourants = new Set(sectionsCourantes.map((section) => section.id));

  for (const section of instantane.sections) {
    if (!idsCourants.has(section.id)) continue;
    await deps.pages.sectionWrite.update(section.id, {
      content: section.content ?? null,
      isVisible: section.isVisible,
    });
  }

  // La restauration est elle-même versionnée : se tromper de version n'est pas
  // une impasse. On rappelle l'état complet (page + sections courantes).
  const sectionsApres = await deps.pages.sectionRead.findByPage(version.entityId);
  await recordVersion(deps.versions, {
    entityType: "page",
    entityId: version.entityId,
    snapshot: { ...restauration.value, sections: sectionsApres },
    comment: `Restauration de la version ${version.versionNumber}`,
    createdBy: restoredBy,
  });

  return ok(restauration.value);
}
