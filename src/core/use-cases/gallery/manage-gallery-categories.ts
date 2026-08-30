import type {
  CreateGalleryCategory,
  GalleryCategory,
} from "../../cms/entities/gallery";
import type {
  GalleryCategoryDeps,
  GalleryCategoryReadPort,
} from "../../cms/ports/gallery.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";
import { slugify } from "../../shared/slug";

/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  LES CATÉGORIES DE LA GALERIE
 * ═══════════════════════════════════════════════════════════════════════════
 *
 * §8H : « la catégorie devient une colonne ». Cinq cas d'usage courts, réunis
 * dans un seul fichier — même forme qu'au Lot 8B pour les catégories
 * d'actualités, et pour la même raison : cinq fonctions de moins de quinze
 * lignes qui se lisent en bloc.
 *
 * ---------------------------------------------------------------------------
 * LA RÈGLE QUI COMPTE : ON NE SUPPRIME PAS UNE CATÉGORIE EMPLOYÉE
 * ---------------------------------------------------------------------------
 * `gallery_items.category_id` est déclarée `on delete restrict` (migration
 * 0005) : la base refuse déjà, avec une erreur 23503. Mais le message qu'elle
 * produit ne dit pas COMBIEN de photos sont concernées, ni qu'il faut les
 * reclasser d'abord. On compte donc avant, pour pouvoir le dire.
 *
 * ---------------------------------------------------------------------------
 * DIFFÉRENCE AVEC LE LOT 8B : LA TEINTE
 * ---------------------------------------------------------------------------
 * `gallery_categories` porte une colonne `tone` que `article_categories` n'a
 * pas. Elle n'est pas décorative : c'est la couleur du `MediaPlaceholder`
 * affiché quand une image ne peut pas être chargée, et les quatre catégories
 * d'origine la portaient déjà dans `src/content/galerie.ts`.
 */

/** Toutes les catégories, dans leur ordre d'affichage. */
export async function listGalleryCategories(
  read: GalleryCategoryReadPort,
): Promise<Result<GalleryCategory[]>> {
  return ok(await read.findAll());
}

export async function createGalleryCategory(
  deps: GalleryCategoryDeps,
  input: CreateGalleryCategory,
): Promise<Result<GalleryCategory>> {
  const slug = input.slug?.trim() || slugify(input.label);

  if (!slug) {
    return err(
      new AppError(
        "VALIDATION",
        "Impossible de déduire une adresse à partir de ce nom. Choisissez-en un autre.",
        { label: "Ce nom ne peut pas servir d'adresse." },
      ),
    );
  }

  const existante = await deps.read.findBySlug(slug);
  if (existante) {
    return err(
      new AppError(
        "CONFLICT",
        // Le message NOMME la catégorie qui occupe la place : deux libellés qui
        // ne diffèrent que par un accent ou une majuscule produisent le même
        // slug, et « existe déjà » devant une liste où aucun nom ne ressemble
        // au sien est incompréhensible (écart nº 128, Lot 8G).
        `La catégorie « ${existante.label} » occupe déjà cette adresse.`,
        { label: "Cette catégorie existe déjà." },
      ),
    );
  }

  // En fin de liste : une catégorie créée doit apparaître là où l'utilisateur
  // vient de cliquer, pas s'intercaler en tête.
  const toutes = await deps.read.findAll();

  return ok(
    await deps.write.create({
      label: input.label,
      slug,
      // La teinte par défaut est celle de la colonne (migration 0005) : elle
      // n'affirme rien, ce qui est le bon choix pour une catégorie dont
      // personne n'a encore décidé la couleur.
      tone: input.tone ?? "neutral",
      position: input.position ?? toutes.length + 1,
    }),
  );
}

/**
 * Renomme une catégorie, et change éventuellement sa teinte.
 *
 * ⚠️  L'ADRESSE N'EST PAS RECALCULÉE — règle reprise du Lot 8B. Le `slug` d'une
 * catégorie de galerie n'apparaît dans aucune URL publique, mais il est la clé
 * de rapprochement du seed et de la migration des quatre photos d'origine. Le
 * recalculer à chaque correction de faute de frappe casserait ce lien sans
 * prévenir.
 */
export async function updateGalleryCategory(
  deps: GalleryCategoryDeps,
  id: string,
  champs: { label: string; tone?: GalleryCategory["tone"] },
): Promise<Result<GalleryCategory>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette catégorie n'existe plus."));
  }

  return ok(
    await deps.write.update(existante.id, {
      label: champs.label,
      // `undefined` = teinte non transmise, donc inchangée. Le mapper ne
      // transmet pas les champs absents.
      tone: champs.tone,
    }),
  );
}

export async function deleteGalleryCategory(
  deps: GalleryCategoryDeps,
  id: string,
): Promise<Result<{ id: string; label: string }>> {
  const existante = await deps.read.findById(id);
  if (!existante) {
    return err(new AppError("NOT_FOUND", "Cette catégorie n'existe plus."));
  }

  const emplois = await deps.items.countByCategory(id);
  if (emplois > 0) {
    return err(
      new AppError(
        "CONFLICT",
        emplois === 1
          ? `« ${existante.label} » classe encore 1 photo. Reclassez-la — ou retirez-lui sa catégorie — avant de supprimer.`
          : `« ${existante.label} » classe encore ${emplois} photos. Reclassez-les — ou retirez-leur leur catégorie — avant de supprimer.`,
      ),
    );
  }

  await deps.write.delete(id);
  return ok({ id, label: existante.label });
}

/**
 * Réordonne les catégories.
 *
 * Reçoit la liste ENTIÈRE dans le nouvel ordre — mêmes raisons qu'aux Lots 8A
 * et 8B. C'est l'ordre des boutons de filtre de `/galerie`.
 */
export async function reorderGalleryCategories(
  deps: GalleryCategoryDeps,
  orderedIds: string[],
): Promise<Result<void>> {
  if (orderedIds.length === 0) {
    return err(new AppError("VALIDATION", "Aucun élément à réordonner."));
  }

  if (new Set(orderedIds).size !== orderedIds.length) {
    return err(
      new AppError("VALIDATION", "La liste contient deux fois la même catégorie."),
    );
  }

  const connues = await deps.read.findAll();
  const idsConnus = new Set(connues.map((c) => c.id));

  if (orderedIds.some((id) => !idsConnus.has(id))) {
    return err(
      new AppError("NOT_FOUND", "Une des catégories à réordonner n'existe plus."),
    );
  }

  // La liste doit être exhaustive : une catégorie absente garderait son
  // ancienne position et viendrait s'intercaler n'importe où.
  if (orderedIds.length !== connues.length) {
    return err(
      new AppError(
        "VALIDATION",
        "La liste de réordonnancement doit contenir toutes les catégories.",
      ),
    );
  }

  await deps.write.reorder(orderedIds);
  return ok(undefined);
}
