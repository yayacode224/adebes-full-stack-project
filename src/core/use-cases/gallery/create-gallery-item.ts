import type { CreateGalleryItem, GalleryItem } from "../../cms/entities/gallery";
import type { GalleryItemDeps } from "../../cms/ports/gallery.port";
import { AppError } from "../../shared/errors";
import { err, ok, type Result } from "../../shared/result";

/**
 * Ajoute une photo à la galerie.
 *
 * ---------------------------------------------------------------------------
 * LA SEULE RÈGLE MÉTIER DU LOT : LA CATÉGORIE DOIT EXISTER
 * ---------------------------------------------------------------------------
 * `category_id` est une clé étrangère `on delete restrict` : la base refuserait
 * déjà un identifiant inconnu, par un 23503 dont le message parle de
 * « violates foreign key constraint ». On vérifie donc AVANT, pour rendre un
 * message français rattaché au bon champ.
 *
 * ⚠️  Le média, lui, n'est PAS vérifié ici, et c'est une décision :
 *
 *   * `media_id` est également une clé étrangère (`not null`, `restrict`) : un
 *     identifiant inventé est refusé par la base de toute façon ;
 *   * le vérifier exigerait un `MediaReadPort` dans `GalleryItemDeps`, donc un
 *     port de plus dans la composition de CHAQUE écriture, pour couvrir un cas
 *     — un UUID de média qui n'existe pas — que seul un POST direct peut
 *     produire, le `<MediaPicker>` ne proposant que des médias réels ;
 *   * et le message que la base rend dans ce cas est déjà traduit par
 *     `mapPostgrestError`.
 *
 * La différence avec la catégorie tient au CAS COURANT : une catégorie
 * supprimée pendant qu'un formulaire était ouvert est atteignable sans mauvaise
 * intention, un média inexistant ne l'est pas.
 *
 * ---------------------------------------------------------------------------
 * AUCUN DOUBLON N'EST REFUSÉ
 * ---------------------------------------------------------------------------
 * Rien n'interdit d'ajouter deux fois la même photo — ni la base, ni le métier.
 * La grille l'afficherait alors deux fois, ce qui ressemble à un défaut
 * d'affichage : l'écran de liste le SIGNALE et le compte en tête de page.
 * Informer plutôt qu'interdire, quand l'état est réversible d'un clic
 * (doctrine des écarts nº 115 et nº 128).
 */
export async function createGalleryItem(
  deps: GalleryItemDeps,
  input: CreateGalleryItem,
): Promise<Result<GalleryItem>> {
  if (input.categoryId) {
    const categorie = await deps.categories.findById(input.categoryId);
    if (!categorie) {
      return err(
        new AppError(
          "VALIDATION",
          "Cette catégorie n'existe plus. Choisissez-en une autre, ou laissez l'élément sans catégorie.",
          { categoryId: "Cette catégorie n'existe plus." },
        ),
      );
    }
  }

  // La nouvelle photo se place en fin de grille. `count()` plutôt qu'un
  // `max(position) + 1` : les positions sont renumérotées de 1 à N à chaque
  // réordonnancement, les deux valeurs coïncident donc toujours.
  const position = input.position ?? (await deps.read.count()) + 1;

  return ok(
    await deps.write.create({
      ...input,
      position,
      /*
        Une photo naît TOUJOURS en brouillon.

        `'draft'` en dur, et non `input.status ?? 'draft'` : la valeur reçue est
        ignorée, quelle qu'elle soit. C'est ce qui garantit que toute mise en
        ligne traverse `setGalleryItemStatus`. Le schéma de création ne
        transporte déjà plus `status`, mais ce cas d'usage est aussi appelable
        depuis un test ou un importateur — et la règle ne doit pas dépendre de
        qui appelle.
      */
      status: "draft",
    }),
  );
}
